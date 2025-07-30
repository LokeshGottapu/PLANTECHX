// routes/authRoutes.js
const authRouter = require('express').Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.get('/verify-email/:token', authController.verifyEmail);
authRouter.put('/update-profile', authController.updateProfile);
authRouter.post('/logout', authMiddleware, authController.logout);
authRouter.post('/refresh-token', authController.refreshToken);

module.exports = authRouter;