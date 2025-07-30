const collegeRouter = require('express').Router();
const collegeController = require('../controllers/collegeController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');

collegeRouter.use(authenticateToken); // Protect all routes below

collegeRouter.post(
  '/',
  authorizeRole('admin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required')
  ],
  collegeController.createCollege
);
collegeRouter.get('/', collegeController.getColleges);
collegeRouter.put('/approve/:collegeId', authorizeRole('master_admin'), collegeController.approveCollege);
collegeRouter.put('/assign-admin', authorizeRole('master_admin'), collegeController.assignCollegeAdmin);
collegeRouter.put('/assign-exam', collegeController.assignExamToCollege);
collegeRouter.put('/grant-lsrw', collegeController.grantLSRWAccess);
collegeRouter.get('/performance/:collegeId', collegeController.getCollegePerformance);
collegeRouter.get('/:collegeId', collegeController.getCollegeById);
collegeRouter.put('/:collegeId', authorizeRole('admin'), collegeController.updateCollege);
collegeRouter.delete('/:collegeId', authorizeRole('master_admin'), collegeController.deleteCollege);
collegeRouter.get('/stats/:collegeId', collegeController.getCollegeStats);

// Batches under a college
collegeRouter.get('/:collegeId/batches', collegeController.getCollegeBatches);
collegeRouter.post('/:collegeId/batches', authorizeRole('admin'), collegeController.createCollegeBatch);

// Streams under a college
collegeRouter.get('/:collegeId/streams', collegeController.getCollegeStreams);

// Students under a college
collegeRouter.get('/:collegeId/students', collegeController.getCollegeStudents);

// Tests under a college
collegeRouter.get('/:collegeId/tests', collegeController.getCollegeTests);
collegeRouter.post('/:collegeId/tests/assign', authorizeRole('admin'), collegeController.assignTestsToCollege);

// Features under a college
collegeRouter.get('/:collegeId/features', collegeController.getCollegeFeatures);
collegeRouter.put('/:collegeId/features', authorizeRole('admin'), collegeController.updateCollegeFeatures);

module.exports = collegeRouter;