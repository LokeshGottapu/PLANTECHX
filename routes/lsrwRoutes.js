const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Get LSRW & SWOT results history for a user
router.get('/lsrw-swot/results', aiController.getLsrwSwotResultsHistory);

module.exports = router;
