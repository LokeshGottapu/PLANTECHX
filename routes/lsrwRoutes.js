const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Get LSRW & SWOT results history for a user
router.get('/lsrw-swot/results', aiController.getLsrwSwotResultsHistory);

// Listening (audio upload)
router.post('/listening', aiController.uploadListeningAudio);
// Speaking (audio upload)
router.post('/speaking', aiController.uploadSpeakingAudio);
// Reading (text/audio upload)
router.post('/reading', aiController.uploadReading);
// Writing (text upload)
router.post('/writing', aiController.uploadWriting);

module.exports = router;
