const userRouter = require('express').Router();
const userController = require('../controllers/userController');
const aiController = require('../controllers/aiController');

userRouter.get('/', userController.getAllUsers);
userRouter.get('/:userId', userController.getUserById);
userRouter.put('/:userId', userController.updateUser);
userRouter.delete('/:userId', userController.deleteUser);
userRouter.post('/chatbot', aiController.chatbotProxy);
userRouter.post('/forgot-password', userController.forgotPassword);
userRouter.post('/reset-password', userController.resetPassword);

module.exports = userRouter;