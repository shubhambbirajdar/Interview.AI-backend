const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// Generate questions using AI
router.post('/', questionController.generateQuestions);

// Get all questions
router.get('/', questionController.getAllQuestions);

// Get questions by category
router.get('/category/:category', questionController.getQuestionsByCategory);

// Get question by ID
router.get('/:id', questionController.getQuestionById);

// Create new question
router.post('/', questionController.createQuestion);

// Update question
router.put('/:id', questionController.updateQuestion);

// Delete question (soft delete)
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
