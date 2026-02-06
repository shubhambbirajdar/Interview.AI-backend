const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Create/generate image
router.post('/create', imageController.createImage);

module.exports = router;
