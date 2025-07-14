const express = require('express');
const router = express.Router();
const practiceTestController = require('../controllers/practiceTestController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// List all practice tests (optionally filter by section/topic)
router.get('/', practiceTestController.list);
// Get a specific practice test
router.get('/:id', practiceTestController.getById);
// Create a new practice test (admin/master admin only)
router.post('/', practiceTestController.add);
// Update a practice test (admin/master admin only)
router.put('/:id', practiceTestController.update);
// Delete a practice test (admin/master admin only)
router.delete('/:id', practiceTestController.remove);

module.exports = router;
