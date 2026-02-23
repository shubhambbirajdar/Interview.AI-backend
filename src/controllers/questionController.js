const Question = require('../models/Question');
const axios = require('axios');
const { OPENROUTER_API_KEY, OPENROUTER_API_URL } = require('../config/constants');

// Get all questions
exports.getAllQuestions = async (req, res) => {
    try {
        // const questions = await Question.find({ isActive: true });
        res.json([]);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching questions', details: error.message });
    }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching question', details: error.message });
    }
};

// Create new question
exports.createQuestion = async (req, res) => {
    try {
        const question = new Question(req.body);
        await question.save();
        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ error: 'Error creating question', details: error.message });
    }
};

// Update question
exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        res.status(400).json({ error: 'Error updating question', details: error.message });
    }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting question', details: error.message });
    }
};

// Get questions by category
exports.getQuestionsByCategory = async (req, res) => {
    try {
        const questions = await Question.find({ 
            category: req.params.category,
            isActive: true 
        });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching questions', details: error.message });
    }
};

// Generate questions using AI
exports.generateQuestions = async (req, res) => {
    console.log(req.body)
    try {
        const { 
            experience,
            technology,
            position,
            interviewType,
            difficultyLevel,
            numberOfQuestions = 10,
            focusAreas = '',
            interviewDuration = 30
        } = req.body.candidateInfo;

        if (!experience || !technology || !position || !interviewType || !difficultyLevel) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                details: 'Please provide experience, technology, position, interviewType, and difficultyLevel' 
            });
        }

        const focusAreasText = focusAreas ? `\nFocus Areas: ${focusAreas}` : '';

        const prompt = `You are an expert technical interviewer. Generate ${numberOfQuestions} interview questions based on these criteria:

Position: ${position}
Technology: ${technology}
Interview Type: ${interviewType}
Experience Level: ${experience} years
Difficulty Level: ${difficultyLevel}
Interview Duration: ${interviewDuration} minutes${focusAreasText}

Instructions:
- Generate exactly ${numberOfQuestions} ${interviewType} interview questions
- Questions should be appropriate for ${difficultyLevel} difficulty level
- Questions should be suitable for ${position} position with ${experience} years of experience
- Each question should be clear, specific, and relevant to ${technology}
- Questions should be answerable within the ${interviewDuration} minute interview duration
${focusAreas ? `- Focus primarily on: ${focusAreas}` : ''}

IMPORTANT: Return ONLY a valid JSON array in this EXACT format (no markdown, no code blocks, no additional text):
[{"id":1,"category":"${technology}","question":"Your question text here","difficulty":"${difficultyLevel}"},{"id":2,"category":"${technology}","question":"Your question text here","difficulty":"${difficultyLevel}"}]

Generate the JSON array now:`;

        const response = await axios.post(
            OPENROUTER_API_URL,
            { 
                model: 'mistralai/mistral-7b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert technical interviewer. Return ONLY a valid JSON array in the specified format, no markdown, no code blocks, no additional text.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        let generatedText = response.data.choices[0]?.message?.content || '';
        
        // Clean up the response - remove markdown code blocks if present
        generatedText = generatedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        // Try to extract JSON from the response
        let generatedQuestions = [];
        try {
            // Find JSON array in the response
            const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                generatedQuestions = JSON.parse(jsonMatch[0]);
                
                // Ensure each question has proper structure
                generatedQuestions = generatedQuestions.map((q, index) => ({
                    id: q.id || (index + 1),
                    category: q.category || technology,
                    question: q.question || 'Question not generated properly',
                    difficulty: q.difficulty || difficultyLevel
                }));
            } else {
                throw new Error('No JSON array found in response');
            }
        } catch (parseError) {
            console.error('JSON parsing error:', parseError.message);
            // Fallback: create default questions if parsing fails
            generatedQuestions = Array.from({ length: numberOfQuestions }, (_, i) => ({
                id: i + 1,
                category: technology,
                question: `Please regenerate - Question ${i + 1} for ${position} ${technology} developer with ${experience} years experience at ${difficultyLevel} level`,
                difficulty: difficultyLevel
            }));
        }

        res.json({
            success: true,
            questions: generatedQuestions,
            metadata: {
                experience,
                technology,
                position,
                interviewType,
                difficultyLevel,
                numberOfQuestions: generatedQuestions.length,
                focusAreas,
                interviewDuration
            }
        });

    } catch (error) {
        console.error('Error generating questions:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error generating questions', 
            details: error.response?.data?.error || error.message 
        });
    }
};
