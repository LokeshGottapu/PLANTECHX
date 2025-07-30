const express = require('express');
const router = express.Router();
const aiTestRequestController = require('../controllers/aiTestRequestController');
const { verifyToken } = require('../middleware/auth');
const { checkMaster } = require('../middleware/checkMaster');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(verifyToken);

// List all AI requests (master admin)
router.get('/', checkMaster, aiTestRequestController.getAllRequests);

// Submit a new AI request (admin)
router.post('/', aiTestRequestController.submitAITestRequest);

// Update an AI request (master admin)
router.put('/:id', checkMaster, aiTestRequestController.updateTestRequest);

// Delete an AI request (master admin)
router.delete('/:id', checkMaster, aiTestRequestController.deleteTestRequest);

// Approve an AI request (master admin)
router.post('/:id/approve', checkMaster, aiTestRequestController.approveTestRequest);

// Reject an AI request (master admin)
router.post('/:id/reject', checkMaster, aiTestRequestController.defaultReject);

// Generate AI test (master admin)
router.get('/:id/generate', checkMaster, aiTestRequestController.generateCustomTest);

// Upload syllabus for a request (admin)
router.post('/:id/upload-syllabus', upload.single('file'), aiTestRequestController.uploadSyllabus);

module.exports = router;
