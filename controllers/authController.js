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

const GenerateToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    if (!token) {
        throw new Error('Token generation failed');
    }

    return token;
};

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const Register = () => {
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [role, setRole] = React.useState('user');
    const [error, setError] = React.useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const { username, email, password, role } = event.target;

            // Validate input
            if (!username || !email || !password) {
                setError('All fields are required');
                return;
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('Invalid email format');
                return;
            }

            // Password strength validation
            if (password.length < 8) {
                setError('Password must be at least 8 characters long');
                return;
            }

            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });

            if (response.ok) {
                const { message, token, user } = await response.json();
                localStorage.setItem('token', token);
                window.location.href = '/';
            } else {
                const { message } = await response.json();
                setError(message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('Error registering user');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Username:
                <input type="text" name="username" value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
                Email:
                <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
                Password:
                <input type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
                Role:
                <select name="role" value={role} onChange={(event) => setRole(event.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </label>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit">Register</button>
        </form>
    );
};

import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (!email || !password) {
                setError('Email and password are required');
                return;
            }

            const response = await axios.post('/api/auth/login', { email, password });

            const { token, refreshToken, user } = response.data;
            // Store tokens and user info as needed
            setSuccess('Login successful');
            setError(null);
        } catch (error) {
            console.error('Login error:', error);
            setError('Invalid credentials');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email:
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>
                Password:
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </label>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
            <button type="submit">Login</button>
        </form>
    );
};

export default Login;

const RefreshToken = () => {
    const [refreshToken, setRefreshToken] = React.useState('');
    const [error, setError] = React.useState(null);
    const [newToken, setNewToken] = React.useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (!refreshToken) {
                setError('Refresh token is required');
                return;
            }
            const response = await axios.post('/api/auth/refresh-token', { refreshToken });
            const { token } = response.data;
            setNewToken(token);
            setError(null);
        } catch (error) {
            console.error('Refresh token error:', error);
            setError('Error refreshing token');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Refresh token:
                <input type="text" value={refreshToken} onChange={e => setRefreshToken(e.target.value)} />
            </label>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {newToken && <div style={{ color: 'green' }}>New token: {newToken}</div>}
            <button type="submit">Refresh token</button>
        </form>
    );
};

const ForgotPassword = () => {
    const [email, setEmail] = React.useState('');
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (!email) {
                setError('Email is required');
                return;
            }
            const response = await axios.post('/api/auth/forgot-password', { email });
            const { requestId } = response.data;
            setError(null);
            setSuccess('Password reset link sent to email');
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('An unexpected error occurred');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email:
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
            <button type="submit">Forgot password</button>
        </form>
    );
};

const ResetPassword = ({ token, newPassword }) => {
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (!token || !newPassword) {
                setError('Token and new password are required');
                return;
            }
            
            // Password strength validation
            if (newPassword.length < 8) {
                setError('Password must be at least 8 characters long');
                return;
            }
            
            const response = await axios.post('/api/auth/reset-password', { token, newPassword });
            const { requestId } = response.data;
            setError(null);
            setSuccess('Password reset successful');
        } catch (error) {
            console.error('Reset password error:', error);
            setError('An unexpected error occurred');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                New password:
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </label>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
            <button type="submit">Reset password</button>
        </form>
    );
};

const VerifyEmail = ({ token }) => {
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);

    const verifyEmail = async () => {
        try {
            if (!token) {
                setError('Verification token is required');
                return;
            }

            const sql = 'SELECT * FROM users WHERE verification_token = ?';
            const users = await api_model.query(sql, [token]);

            if (users.length === 0) {
                setError('Invalid verification token');
                return;
            }

            const user = users[0];

            if (!user) {
                setError('User retrieval failed');
                return;
            }

            await api_model.updateUser(user.userId, [
                { key: 'email_verified', value: true },
                { key: 'verification_token', value: null }
            ]);

            setSuccess('Email verified successfully');
        } catch (error) {
            console.error('Email verification error:', error);
            setError('Error verifying email');
        }
    };

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
            <button onClick={verifyEmail}>Verify email</button>
        </div>
    );
};

const UpdateProfile = ({ userId }) => {
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updates = [];
            if (username) updates.push({ key: 'username', value: username });
            if (email) updates.push({ key: 'email', value: email });

            if (newPassword) {
                const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
                if (!isValidPassword) {
                    setError('Current password is incorrect');
                    return;
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPassword, salt);
                updates.push({ key: 'password', value: hashedPassword });
            }

            if (updates.length > 0) {
                await api_model.updateUser(userId, updates);
                setSuccess('Profile updated successfully');
            } else {
                setError('No updates provided');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            setError('Error updating profile');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Username:
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
            </label>
            <label>
                Email:
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </label>
            <label>
                Current password:
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </label>
            <label>
                New password:
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </label>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>{success}</div>}
            <button type="submit">Update profile</button>
        </form>
    );
};

// Get user profile info
const Profile = () => {
    const [user, setUser] = React.useState(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (!window.user || !window.user.userId) {
                    setError('User ID is missing');
                    return;
                }
                const { userId } = window.user;
                const users = await api_model.getUser(userId);
                if (!users || users.length === 0) {
                    setError('User not found');
                    return;
                }
                const { password, reset_token, reset_token_expiry, verification_token, ...userData } = users[0];
                setUser(userData);
            } catch (error) {
                console.error('Get profile error:', error);
                setError('Error fetching profile');
            }
        };
        fetchProfile();
    }, []);

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Profile</h2>
            <ul>
                <li>Username: {user.username}</li>
                <li>Email: {user.email}</li>
                <li>Department: {user.department}</li>
                <li>Year: {user.year}</li>
                <li>Semester: {user.semester}</li>
                <li>Section: {user.section}</li>
            </ul>
        </div>
    );
};

const ResendVerificationLink = () => {
    const [error, setError] = React.useState(null);

    const handleClick = async () => {
        try {
            if (!window.user || !window.user.userId) {
                setError('User ID is missing');
                return;
            }
            const { userId } = window.user;
            const users = await api_model.getUser(userId);
            if (!users || users.length === 0) {
                setError('User not found');
                return;
            }
            const user = users[0];
            if (user.email_verified) {
                setError('Email already verified');
                return;
            }
            const verificationToken = generateToken();
            await api_model.updateUser(userId, [
                { key: 'verification_token', value: verificationToken }
            ]);
            const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
            await transporter.sendMail({
                to: user.email,
                subject: 'Verify your email',
                html: `Please click this link to verify your email: <a href="${verifyUrl}">Verify Email</a>`
            });
        } catch (error) {
            console.error('Resend verification link error:', error);
            setError('Error resending verification link');
        }
    };

    return (
        <div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button onClick={handleClick}>Resend verification link</button>
        </div>
    );
};

const InviteAdmin = () => {
    const [error, setError] = React.useState(null);

    const handleClick = async (event) => {
        event.preventDefault();
        try {
            const { email, role } = event.currentTarget;
            if (!email || !role) {
                setError('Email and role are required');
                return;
            }
            // Generate invitation token
            const inviteToken = generateToken();
            // Save invitation in DB (optional: create a pending user record)
            if (!await api_model.createInvite(email, role, inviteToken)) {
                setError('Error saving admin invitation');
                return;
            }
            const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
            const mailOptions = {
                to: email,
                subject: 'Admin Invitation',
                html: `You have been invited as an admin. Click here to accept: <a href="${inviteUrl}">Accept Invitation</a>`
            };
            if (process.env.NODE_ENV === 'production') {
                // In production, send email only if the transporter is properly configured
                if (!transporter || !transporter.sendMail) {
                    setError('Error sending admin invitation. Transporter is not configured');
                    return;
                }
                await transporter.sendMail(mailOptions);
            } else {
                // In dev, log the email instead of sending it
                console.log('Invite admin email sent:', mailOptions);
            }
            setError(null);
        } catch (error) {
            console.error('Invite admin error:', error);
            setError('Error sending admin invitation');
        }
    };

    return (
        <form onSubmit={handleClick}>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <label>
                Email:
                <input type="email" name="email" />
            </label>
            <label>
                Role:
                <select name="role">
                    <option value="master_admin">Master Admin</option>
                    <option value="college_admin">College Admin</option>
                    <option value="faculty">Faculty</option>
                </select>
            </label>
            <button type="submit">Invite</button>
        </form>
    );
};

const Logout = ({ userId }) => {
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(false);

    const handleLogout = async () => {
        let connection;
        try {
            if (!userId) {
                setError('User ID is required');
                return;
            }
            connection = await mysql.createConnection(dbConfig);
            await connection.execute(
                'UPDATE users SET refresh_token = NULL, refresh_token_expiry = NULL WHERE userId = ?',
                [userId]
            );
            setSuccess(true);
        } catch (error) {
            console.error('Logout error:', error);
            setError('Error during logout');
        } finally {
            if (connection) await connection.end();
        }
    };

    return (
        <div>
            {success && <div>Logged out successfully</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateProfile,
    getProfile,
    resendVerificationLink,
    inviteAdmin,
    logout,
    refreshToken
};