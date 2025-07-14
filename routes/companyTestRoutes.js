const express = require('express');
const router = express.Router();
const companyTestController = require('../controllers/companyTestController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// List all company tests (optionally filter by company/topic)
router.get('/', companyTestController.list);
// Get a specific company test
router.get('/:id', companyTestController.getById);
// Create a new company test (admin/master admin only)
router.post('/', companyTestController.add);
// Update a company test (admin/master admin only)
router.put('/:id', companyTestController.update);
// Delete a company test (admin/master admin only)
router.delete('/:id', companyTestController.remove);

module.exports = router;
