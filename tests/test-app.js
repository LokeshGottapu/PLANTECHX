const express = require('express');
const cors = require('cors');
const mockAuthController = require('./mocks/authController.mock');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
app.post('/auth/register', mockAuthController.register);
app.post('/auth/login', mockAuthController.login);

module.exports = app;