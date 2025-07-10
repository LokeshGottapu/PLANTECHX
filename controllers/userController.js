// User Controller

const getAllUsers = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Failed to establish a database connection');
        }

        const [users] = await connection.execute('SELECT * FROM users');
        if (!users) {
            throw new Error('No users found');
        }
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
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

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    } finally {
        if (connection) {
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
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing the connection:', endError);
            }
        }

        console.error('Create user error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
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
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing the connection:', endError);
            }
        }
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
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
            await connection.end();
            return res.status(404).json({ message: 'User not found' });
        }

        if (connection) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        if (connection) {
            await connection.end().catch(endError => console.error('Error closing the connection:', endError));
        }

        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};