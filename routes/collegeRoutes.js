const collegeRouter = require('express').Router();
const collegeController = require('../controllers/collegeController');

collegeRouter.post('/', collegeController.createCollege);
collegeRouter.get('/', collegeController.getColleges);
collegeRouter.put('/approve/:collegeId', collegeController.approveCollege);
collegeRouter.put('/assign-admin', collegeController.assignCollegeAdmin);
collegeRouter.put('/assign-exam', collegeController.assignExamToCollege);
collegeRouter.put('/grant-lsrw', collegeController.grantLSRWAccess);
collegeRouter.get('/performance/:collegeId', collegeController.getCollegePerformance);
collegeRouter.get('/:collegeId', collegeController.getCollegeById);
collegeRouter.put('/:collegeId', collegeController.updateCollege);
collegeRouter.delete('/:collegeId', collegeController.deleteCollege);
collegeRouter.get('/stats/:collegeId', collegeController.getCollegeStats);

module.exports = collegeRouter;