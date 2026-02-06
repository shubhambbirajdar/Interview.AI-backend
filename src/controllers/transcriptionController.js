const axios = require('axios');
const fs = require('fs');
const { promisify } = require('util');
const { ASSEMBLYAI_API_KEY, OPENROUTER_API_KEY } = require('../config/constants');
const Interview = require('../models/Interview');
const Transcription = require('../models/Transcription');

// Transcribe audio and evaluate answer
exports.transcribeAudio = async (req, res) => {
    const audioData = req.body.audio;
    const question = req.body.question;
    let interviewId = req.body.interviewId;
    const experience = req.body.experience || 'intermediate';
    const difficultyLevel = req.body.difficultyLevel || 'medium';
    const subject = req.body.subject || 'programming';
    const technology = req.body.technology || 'general';

    // If no interviewId provided, create a new interview
    if (!interviewId) {
        try {
            const newInterview = new Interview({
                userId: req.user._id,
                questions: [],
                status: 'in-progress'
            });
            await newInterview.save();
            interviewId = newInterview._id.toString();
        } catch (error) {
            return res.status(500).json({ 
                error: 'Failed to create interview', 
                details: error.message 
            });
        }
    } else {
        // Verify the interview belongs to the user
        try {
            const existingInterview = await Interview.findById(interviewId);
            if (!existingInterview) {
                return res.status(404).json({ error: 'Interview not found' });
            }
            if (existingInterview.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ error: 'Not authorized to access this interview' });
            }
        } catch (error) {
            return res.status(500).json({ 
                error: 'Failed to validate interview', 
                details: error.message 
            });
        }
    }

    // Save audio to a file
    const audioBuffer = Buffer.from(audioData, 'base64');
    const audioFilePath = 'temp_audio.wav';
    await promisify(fs.writeFile)(audioFilePath, audioBuffer);
    
    try {
        // Upload audio to AssemblyAI
        const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioBuffer, {
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': 'audio/wav',
            },
        });
        const audioUrl = uploadResponse.data.upload_url;
        
        // Request transcription
        const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
            audio_url: audioUrl,
        }, {
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
            },
        });
        
        const transcriptId = transcriptResponse.data.id;
        
        // Save transcription to database
        const transcription = new Transcription({
            audioUrl,
            transcriptionId: transcriptId,
            status: 'processing',
            interviewId
        });
        await transcription.save();
        
        // Poll for the transcript result
        let transcriptResult;
        do {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            const resultResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                    'Authorization': ASSEMBLYAI_API_KEY,
                },
            });
            transcriptResult = resultResponse.data;

            if (transcriptResult.status === 'completed') {
                // Cleanup
                if (fs.existsSync(audioFilePath)) {
                    fs.unlinkSync(audioFilePath);
                }
                
                // Update transcription in database
                transcription.text = transcriptResult.text;
                transcription.status = 'completed';
                await transcription.save();
                
                // Get evaluation with all parameters
                const result = await getEvaluation({ 
                    question, 
                    answer: transcriptResult.text,
                    experience,
                    difficultyLevel,
                    subject,
                    technology
                });

                // Update interview with answer and score
                if (interviewId) {
                    await Interview.findByIdAndUpdate(interviewId, {
                        $push: {
                            questions: {
                                questionText: question,
                                answer: transcriptResult.text,
                                transcription: transcriptResult.text,
                                score: result.score,
                                evaluationDetails: result.evaluation,
                                experience,
                                difficultyLevel,
                                subject,
                                technology
                            }
                        }
                    });
                }

                return res.json({ 
                    success: true,
                    data: result,
                    interviewId
                });
            } else if (transcriptResult.status === 'failed') {
                if (fs.existsSync(audioFilePath)) {
                    fs.unlinkSync(audioFilePath);
                }
                
                // Update transcription status
                transcription.status = 'failed';
                transcription.error = transcriptResult.error;
                await transcription.save();
                
                return res.status(500).json({ error: 'Transcription failed', details: transcriptResult.error });
            }
        } while (transcriptResult.status !== 'completed');

    } catch (error) {
        console.error('Error during transcription:', error);
        return res.status(500).json({ error: 'Transcription error', details: error.message });
    }
};

// Evaluate answer using AI
const getEvaluation = async (data) => {
    const { question, answer, experience, difficultyLevel, subject, technology } = data;
    
    const prompt = `Role: You are an expert technical interviewer and evaluator specializing in ${subject} and ${technology}.

Candidate Profile:
- Experience Level: ${experience}
- Subject: ${subject}
- Technology: ${technology}
- Difficulty Level: ${difficultyLevel}

Question: ${question}

Candidate's Answer: ${answer}

Evaluation Criteria:

1. Technical Accuracy (0-6 points):
   - 6: Perfectly accurate with correct definitions, concepts, and implications
   - 4-5: Mostly correct with minor omissions or inaccuracies
   - 2-3: Partially correct with significant gaps
   - 0-1: Incorrect or severely flawed understanding

2. Depth of Knowledge (0-3 points):
   - 3: Demonstrates deep understanding with examples, edge cases, and best practices
   - 2: Good understanding with some examples
   - 1: Surface-level understanding
   - 0: No meaningful depth

3. Clarity & Communication (0-1 point):
   - 1: Well-structured, clear, and easy to understand
   - 0: Confusing, poorly structured, or unclear

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no additional text) in this EXACT format:
{
  "score": "X/10",
  "totalScore": X,
  "technicalAccuracy": X,
  "depth": X,
  "clarity": X,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "overallFeedback": "Brief summary of the answer quality",
  "passStatus": "pass" or "fail"
}

Evaluate now and return JSON:`;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
            messages: [
                { role: 'user', content: prompt }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'interview-ai'
            }
        });

        let evaluationData;
        const aiResponse = response.data.choices[0].message.content;
        
        try {
            // Try to parse JSON from AI response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                evaluationData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            // Fallback if JSON parsing fails
            const scoreMatch = aiResponse.match(/(\d+)\/10/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
            
            evaluationData = {
                score: `${score}/10`,
                totalScore: score,
                technicalAccuracy: Math.floor(score * 0.6),
                depth: Math.floor(score * 0.3),
                clarity: score >= 7 ? 1 : 0,
                strengths: ['Response provided'],
                weaknesses: ['Unable to parse detailed evaluation'],
                suggestions: ['Please provide more detailed answers'],
                overallFeedback: aiResponse.substring(0, 200),
                passStatus: score >= 6 ? 'pass' : 'fail'
            };
        }

        return {
            success: true,
            score: evaluationData.score,
            evaluation: evaluationData,
            transcriptResult: answer,
            question: question,
            experience: experience,
            difficultyLevel: difficultyLevel,
            subject: subject,
            technology: technology
        };
    } catch (error) {
        console.error('Error during evaluation:', error.response ? error.response.data : error.message);
        throw new Error(`${error.message}`);
    }
};

module.exports.getEvaluation = getEvaluation;
