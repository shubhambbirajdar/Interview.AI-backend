const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

// Create new interview
router.post('/', protect, interviewController.createInterview);

// Get all interviews
router.get('/', protect, interviewController.getAllInterviews);

// Get interview by ID
router.get('/:id', protect, interviewController.getInterviewById);

// Update interview
router.put('/:id', protect, interviewController.updateInterview);

// Complete interview
router.post('/:id/complete', protect, interviewController.completeInterview);

// Delete interview
router.delete('/:id', protect, interviewController.deleteInterview);

module.exports = router;
