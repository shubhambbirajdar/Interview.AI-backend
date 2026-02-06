const Interview = require('../models/Interview');
const User = require('../models/User');

// Create new interview
exports.createInterview = async (req, res) => {
    try {
        // Get user from token
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user is free tier and has reached limit
        if (user.role === 'free') {
            const interviewCount = await Interview.countDocuments({ userId: req.user.id });
            
            if (interviewCount >= 2) {
                return res.status(403).json({ 
                    error: 'Interview limit reached', 
                    details: 'Free users can only create 2 interviews. Please upgrade to premium for unlimited interviews.',
                    currentCount: interviewCount,
                    limit: 2
                });
            }
        }

        // Create interview with userId
        const interview = new Interview({
            ...req.body,
            userId: req.user.id
        });
        
        await interview.save();
        
        res.status(201).json({
            success: true,
            interview,
            message: user.role === 'free' ? `You have ${2 - (await Interview.countDocuments({ userId: req.user.id }))} interviews remaining` : 'Interview created successfully'
        });
    } catch (error) {
        res.status(400).json({ error: 'Error creating interview', details: error.message });
    }
};

// Get interview by ID
exports.getInterviewById = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)
            .populate('questions.questionId');
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.json(interview);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching interview', details: error.message });
    }
};

// Get all interviews
exports.getAllInterviews = async (req, res) => {
    try {
        // Get interviews for the logged-in user
        const interviews = await Interview.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .populate('questions.questionId');
        
        const user = await User.findById(req.user.id);
        
        res.json({
            success: true,
            count: interviews.length,
            interviews,
            userRole: user.role,
            limit: user.role === 'free' ? 2 : 'unlimited',
            remaining: user.role === 'free' ? Math.max(0, 2 - interviews.length) : 'unlimited'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching interviews', details: error.message });
    }
};

// Update interview
exports.updateInterview = async (req, res) => {
    try {
        const interview = await Interview.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.json(interview);
    } catch (error) {
        res.status(400).json({ error: 'Error updating interview', details: error.message });
    }
};

// Complete interview
exports.completeInterview = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Check if user owns this interview
        if (interview.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to access this interview' });
        }

        // Calculate total score and detailed report
        let totalScore = 0;
        let totalAccuracy = 0;
        let totalDepth = 0;
        let totalClarity = 0;
        let passedCount = 0;
        let failedCount = 0;
        
        const detailedResults = interview.questions.map((q, index) => {
            const evaluation = q.evaluationDetails || {};
            totalScore += evaluation.totalScore || 0;
            totalAccuracy += evaluation.technicalAccuracy || 0;
            totalDepth += evaluation.depth || 0;
            totalClarity += evaluation.clarity || 0;
            
            if (evaluation.passStatus === 'pass') passedCount++;
            else failedCount++;
            
            return {
                questionNumber: index + 1,
                question: q.questionText,
                answer: q.answer,
                score: q.score || evaluation.score,
                evaluation: evaluation,
                technology: q.technology,
                difficulty: q.difficultyLevel
            };
        });

        const questionCount = interview.questions.length || 1;
        const averageScore = Math.round(totalScore / questionCount);
        const averageAccuracy = Math.round(totalAccuracy / questionCount);
        const averageDepth = Math.round(totalDepth / questionCount);
        const averageClarity = Math.round(totalClarity / questionCount);
        const overallPassStatus = passedCount >= Math.ceil(questionCount / 2) ? 'pass' : 'fail';

        interview.status = 'completed';
        interview.completedAt = new Date();
        interview.totalScore = averageScore;
        await interview.save();

        res.json({
            success: true,
            message: 'Interview completed successfully',
            report: {
                interviewId: interview._id,
                candidateName: interview.candidateName,
                candidateEmail: interview.candidateEmail,
                status: interview.status,
                startedAt: interview.startedAt,
                completedAt: interview.completedAt,
                duration: Math.round((interview.completedAt - interview.startedAt) / 1000 / 60) + ' minutes',
                summary: {
                    totalQuestions: questionCount,
                    questionsAnswered: questionCount,
                    passed: passedCount,
                    failed: failedCount,
                    averageScore: averageScore,
                    totalScore: `${averageScore}/10`,
                    overallStatus: overallPassStatus
                },
                performance: {
                    technicalAccuracy: `${averageAccuracy}/6`,
                    depth: `${averageDepth}/3`,
                    clarity: `${averageClarity}/1`,
                    accuracyPercentage: Math.round((averageAccuracy / 6) * 100) + '%',
                    depthPercentage: Math.round((averageDepth / 3) * 100) + '%',
                    clarityPercentage: Math.round((averageClarity / 1) * 100) + '%'
                },
                detailedResults: detailedResults,
                recommendations: generateRecommendations(averageScore, averageAccuracy, averageDepth, averageClarity)
            }
        });
    } catch (error) {
        res.status(400).json({ error: 'Error completing interview', details: error.message });
    }
};

// Helper function to generate recommendations
const generateRecommendations = (score, accuracy, depth, clarity) => {
    const recommendations = [];
    
    if (accuracy < 4) {
        recommendations.push('Focus on improving technical accuracy by reviewing fundamental concepts');
    }
    if (depth < 2) {
        recommendations.push('Work on providing more detailed explanations with examples');
    }
    if (clarity < 1) {
        recommendations.push('Practice structuring your answers more clearly');
    }
    if (score >= 8) {
        recommendations.push('Excellent performance! Keep up the good work');
    } else if (score >= 6) {
        recommendations.push('Good performance with room for improvement');
    } else {
        recommendations.push('Consider additional study and practice before the next interview');
    }
    
    return recommendations;
};

// Delete interview
exports.deleteInterview = async (req, res) => {
    try {
        const interview = await Interview.findByIdAndDelete(req.params.id);
        if (!interview) {
            return res.status(404).json({ error: 'Interview not found' });
        }
        res.json({ message: 'Interview deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting interview', details: error.message });
    }
};
