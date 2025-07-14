const express = require('express');
const router = express.Router();
const assessmentTestController = require('../controllers/assessmentTestController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// List all assessment tests (optionally filter by section/topic)
router.get('/', assessmentTestController.list);
// Get a specific assessment test
router.get('/:id', assessmentTestController.getById);
// Create a new assessment test (admin/master admin only)
router.post('/', assessmentTestController.add);
// Update an assessment test (admin/master admin only)
router.put('/:id', assessmentTestController.update);
// Delete an assessment test (admin/master admin only)
router.delete('/:id', assessmentTestController.remove);

module.exports = router;
