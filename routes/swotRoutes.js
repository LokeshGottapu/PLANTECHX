const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Store SWOT feedback report
router.post('/feedback', aiController.storeSwotFeedback);

// Get SWOT feedback report
router.get('/feedback/:userId', aiController.getSwotFeedback);

module.exports = router;
