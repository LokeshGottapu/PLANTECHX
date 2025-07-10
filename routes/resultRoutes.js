const resultRouter = require('express').Router();
const resultController = require('../controllers/resultController');

resultRouter.post('/', resultController.submitResult);
resultRouter.get('/', resultController.getAllResults);
resultRouter.get('/user/:userId', resultController.getResultsByUser);
resultRouter.get('/student/:studentId', resultController.getResultsByStudent);
resultRouter.get('/exam/:examId', resultController.getResultsByExam);
resultRouter.post('/submit', resultController.submitResult);
resultRouter.get('/history', resultController.getHistory);
resultRouter.get('/swot-report', resultController.getSwotReport);
resultRouter.get('/:resultId/pdf', resultController.getResultPdf);

module.exports = resultRouter;