const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');
const { protect } = require('../middleware/auth');

// Transcribe audio and evaluate answer
router.post('/transcribe', protect, transcriptionController.transcribeAudio);

module.exports = router;
