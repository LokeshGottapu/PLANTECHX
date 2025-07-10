const express = require('express');
const router = express.Router();
const aiTestRequestController = require('../controllers/aiTestRequestController');
const { verifyToken } = require('../middleware/auth');
const { checkMaster } = require('../middleware/checkMaster');

// Admin submits a test generation request
router.post('/request', verifyToken, aiTestRequestController.submitAITestRequest);

// Master admin views all pending requests
router.get('/requests', verifyToken, checkMaster, aiTestRequestController.getPendingAITestRequests);

// Master admin triggers AI test generation
router.post('/request/:id/generate', verifyToken, checkMaster, aiTestRequestController.generateCustomTest);

// Master admin rejects a request
router.post('/request/:id/reject', verifyToken, checkMaster, aiTestRequestController.defaultReject);

// Update AI test request status (Pending, Approved, Rejected)
router.put('/request/:id/status', aiTestRequestController.updateTestRequestStatus);

module.exports = router;
