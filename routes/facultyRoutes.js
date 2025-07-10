const facultyRouter = require('express').Router();
const facultyController = require('../controllers/facultyController');
const multer = require('multer');
const upload = multer();

facultyRouter.post('/', facultyController.createFaculty);
facultyRouter.get('/', facultyController.getAllFaculty);
facultyRouter.get('/:facultyId', facultyController.getFacultyById);
facultyRouter.put('/:facultyId', facultyController.updateFaculty);
facultyRouter.delete('/:facultyId', facultyController.deleteFaculty);
facultyRouter.put('/:facultyId/assign-subject', facultyController.assignSubjectToFaculty);
facultyRouter.post('/exams', facultyController.createExamByFaculty);
facultyRouter.post('/content', facultyController.uploadContentByFaculty);
facultyRouter.post('/questions/upload', upload.single('file'), facultyController.uploadQuestionBank);

module.exports = facultyRouter;