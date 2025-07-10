// routes/authRoutes.js
const authRouter = require('express').Router();
const authController = require('../controllers/authController');

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.get('/verify-email/:token', authController.verifyEmail);
authRouter.put('/update-profile', authController.updateProfile);

module.exports = authRouter;