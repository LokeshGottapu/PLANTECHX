const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Token generation for password reset and email verification
const generateToken = () => crypto.randomBytes(32).toString('hex');

const register = async (req, res) => {
    let connection;
    try {
        const { username, email, password, role = 'user' } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password, role, createdAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [username, email, hashedPassword, role]
        );

        const token = jwt.sign(
            { id: result.insertId, username, email, role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const login = async (req, res) => {
    let connection;
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.userId, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.userId,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const forgotPassword = async (req, res) => {
    let connection;
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                error: 'Validation Error',
                message: 'Email is required' 
            });
        }

        connection = await mysql.createConnection(dbConfig);
        
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                error: 'Not Found',
                message: 'User not found' 
            });
        }

        const user = users[0];
        const resetToken = generateToken();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await connection.execute(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE userId = ?',
            [resetToken, resetTokenExpiry, user.userId]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await transporter.sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `Please click this link to reset your password: <a href="${resetUrl}">Reset Password</a>`
        });

        res.json({ 
            message: 'Password reset link sent to email',
            requestId: crypto.randomBytes(16).toString('hex')
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            requestId: crypto.randomBytes(16).toString('hex')
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const resetPassword = async (req, res) => {
    let connection;
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ 
                error: 'Validation Error',
                message: 'Token and new password are required' 
            });
        }

        // Password strength validation
        if (newPassword.length < 8) {
            return res.status(400).json({ 
                error: 'Validation Error',
                message: 'Password must be at least 8 characters long' 
            });
        }
        
        connection = await mysql.createConnection(dbConfig);
        
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ 
                error: 'Validation Error',
                message: 'Invalid or expired reset token' 
            });
        }

        const user = users[0];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await connection.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE userId = ?',
            [hashedPassword, user.userId]
        );

        res.json({ 
            message: 'Password reset successful',
            requestId: crypto.randomBytes(16).toString('hex')
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            requestId: crypto.randomBytes(16).toString('hex')
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const sql = 'SELECT * FROM users WHERE verification_token = ?';
        const users = await api_model.query(sql, [token]);

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        const user = users[0];
        await api_model.updateUser(user.userId, [
            { key: 'email_verified', value: true },
            { key: 'verification_token', value: null }
        ]);

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Error verifying email' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const { username, email, currentPassword, newPassword } = req.body;
        
        const users = await api_model.getUser(userId);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updates = [];
        if (username) updates.push({ key: 'username', value: username });
        if (email) updates.push({ key: 'email', value: email });

        if (newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            updates.push({ key: 'password', value: hashedPassword });
        }

        if (updates.length > 0) {
            await api_model.updateUser(userId, updates);
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile
};