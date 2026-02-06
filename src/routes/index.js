const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const questionRoutes = require('./questionRoutes');
const transcriptionRoutes = require('./transcriptionRoutes');
const imageRoutes = require('./imageRoutes');
const interviewRoutes = require('./interviewRoutes');
const paymentRoutes = require('./paymentRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/', transcriptionRoutes); // For /transcribe endpoint
router.use('/image', imageRoutes);
router.use('/interviews', interviewRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;
