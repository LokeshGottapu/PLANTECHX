// User Controller

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const PasswordReset = require('../models/passwordReset');
const nodemailer = require('nodemailer');

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

const inviteUser = async (req, res) => {
    let connection = null;
    try {
        const { name, email, role } = req.body;
        if (!name || !email || !role) {
            return res.status(400).json({ message: 'Name, email, and role are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Check if user already exists
        const [existingUsers] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'User already exists' });
        }

        // Generate random password
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create user
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Send invitation email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'You are invited!',
            text: `Hello ${name},\n\nYou have been invited. Your temporary password is: ${tempPassword}\nPlease log in and change your password.`
        });

        await connection.end();
        res.status(201).json({ message: 'User invited successfully', userId: result.insertId });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Invite user error:', error);
        res.status(500).json({ message: 'Error inviting user', error: error.message });
    }
};

const getUserPermissions = async (req, res) => {
    let connection = null;
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: 'User ID is required' });

        connection = await mysql.createConnection(dbConfig);
        const [permissions] = await connection.execute(
            'SELECT permission FROM user_permissions WHERE user_id = ?',
            [userId]
        );
        await connection.end();

        res.json({ userId, permissions: permissions.map(p => p.permission) });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Get user permissions error:', error);
        res.status(500).json({ message: 'Error fetching permissions', error: error.message });
    }
};

const updateUserPermissions = async (req, res) => {
    let connection = null;
    try {
        const { userId } = req.params;
        const { permissions } = req.body; // Array of permission strings
        if (!userId || !Array.isArray(permissions)) {
            return res.status(400).json({ message: 'User ID and permissions array are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Remove existing permissions
        await connection.execute('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

        // Insert new permissions
        for (const perm of permissions) {
            await connection.execute(
                'INSERT INTO user_permissions (user_id, permission) VALUES (?, ?)', [userId, perm]
            );
        }

        await connection.end();
        res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
        if (connection) await connection.end();
        console.error('Update user permissions error:', error);
        res.status(500).json({ message: 'Error updating permissions', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    forgotPassword,
    resetPassword,
    inviteUser,
    getUserPermissions,
    updateUserPermissions
};