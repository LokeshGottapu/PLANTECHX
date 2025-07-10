// User Controller

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const PasswordReset = require('../models/passwordReset');

const getAllUsers = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Failed to establish a database connection');
        }

        const [users] = await connection.execute('SELECT * FROM users');
        if (!users || !Array.isArray(users) || users.length === 0) {
            throw new Error('No users found');
        }
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        if (error instanceof Error) {
            res.status(500).json({ message: 'Error fetching users', error: error.message });
        } else {
            res.status(500).json({ message: 'Error fetching users', error: 'Unknown error occurred' });
        }
    } finally {
        if (connection && connection.end) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing the connection:', endError);
            }
        }
    }
};

const getUserById = async (req, res) => {
    let connection = null;
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Failed to establish a database connection');
        }

        const [users] = await connection.execute(
            'SELECT * FROM users WHERE userId = ?',
            [userId]
        );

        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        if (!user || typeof user !== 'object') {
            throw new Error('User not found');
        }

        res.json(user);
    } catch (error) {
        if (!(error instanceof Error)) {
            error = new Error('Unknown error occurred');
        }
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    } finally {
        if (connection && connection.end) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing the connection:', endError);
            }
        }
    }
};

const createUser = async (req, res) => {
    let connection = null;
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Failed to establish a database connection');
        }

        const [existingUsers] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers && existingUsers.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        if (!result || !result.insertId) {
            throw new Error('Failed to create user');
        }

        await connection.end();
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        if (error instanceof Error && error.message) {
            console.error('Create user error:', error.message);
            res.status(500).json({ message: 'Error creating user', error: error.message });
        } else {
            console.error('Create user error:', JSON.stringify(error));
            res.status(500).json({ message: 'Error creating user', error: 'Unknown error occurred' });
        }

        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing the connection:', endError);
            }
        }
    }
};

const updateUser = async (req, res) => {
    let connection = null;
    try {
        const { userId } = req.params;
        const { username, email, currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT * FROM users WHERE userId = ?', [userId]);

        if (!users || users.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        if (!user) {
            throw new Error('User not found');
        }

        const updates = [];
        const values = [];
        if (username) { updates.push('username = ?'); values.push(username); }
        if (email) { updates.push('email = ?'); values.push(email); }

        if (newPassword) {
            if (!currentPassword) {
                await connection.end();
                return res.status(400).json({ message: 'Current password is required to set a new password' });
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                await connection.end();
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length > 0) {
            values.push(userId);
            const [result] = await connection.execute(`UPDATE users SET ${updates.join(', ')} WHERE userId = ?`, values);

            if (!result || result.affectedRows === 0) {
                await connection.end();
                return res.status(404).json({ message: 'User not found or no changes made' });
            }
        }

        await connection.end();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Update user error:', error.message);
            res.status(500).json({ message: 'Error updating user', error: error.message });
        } else {
            console.error('Update user error:', JSON.stringify(error));
            res.status(500).json({ message: 'Error updating user', error: 'Unknown error occurred' });
        }

        if (connection && connection.end) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing the connection:', endError);
            }
        }
    }
};

const deleteUser = async (req, res) => {
    let connection = null;
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Failed to establish a database connection');
        }

        const [result] = await connection.execute('DELETE FROM users WHERE userId = ?', [userId]);

        if (!result || result.affectedRows === 0) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
            return res.status(404).json({ message: 'User not found' });
        }

        await connection.end().catch(endError => console.error('Error closing the connection:', endError));

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        if (connection) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
        }

        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user', error: error?.message || 'Unknown error' });
    }
};

// Request password reset (send email with token)
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);

        if (!users || users.length === 0) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = users[0]?.id;
        if (!userId) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
            return res.status(500).json({ message: 'Error processing request', error: 'User ID is missing' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 min

        await PasswordReset.create({ userId, token, expiresAt });

        await connection.end().catch(endError => console.error('Error closing the connection:', endError));

        // TODO: Send email with reset link (token)
        res.json({ message: 'Password reset link sent to email (mock)', token });
    } catch (error) {
        if (connection) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
        }

        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error?.message || 'Unknown error' });
    }
};

// Reset password using token
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword required' });
    let connection = null;
    try {
        const reset = await PasswordReset.findByToken(token);
        if (!reset) return res.status(400).json({ message: 'Invalid or expired token' });
        const userId = reset?.user_id;
        if (!userId) {
            throw new Error('User ID is missing');
        }
        connection = await mysql.createConnection(dbConfig);
        const hashed = await bcrypt.hash(newPassword, 10);
        const [updateResult] = await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to reset password');
        }
        await PasswordReset.markUsed(token);
        await connection.end();
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        if (connection) await connection.end().catch(endError => console.error('Error closing the connection:', endError));
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    forgotPassword,
    resetPassword
};