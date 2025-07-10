const questionRouter = require('express').Router();
const questionController = require('../controllers/questionController');

questionRouter.post('/generate', questionController.generateQuestion);
questionRouter.get('/', questionController.getAllQuestions);
questionRouter.get('/:questionId', questionController.getQuestionById);
questionRouter.put('/:questionId', questionController.updateQuestion);
questionRouter.delete('/:questionId', questionController.deleteQuestion);

module.exports = questionRouter;