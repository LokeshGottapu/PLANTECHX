const examRouter = require('express').Router();
const examController = require('../controllers/examController');

examRouter.post('/', examController.createExam);
examRouter.get('/', examController.getAllExams);
examRouter.get('/:examId', examController.getExamById);
examRouter.put('/:examId', examController.updateExam);
examRouter.delete('/:examId', examController.deleteExam);

module.exports = examRouter;