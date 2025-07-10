const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const crypto = require('crypto');

// 1. Platform Overview
const getPlatformOverview = async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        const [[{ totalColleges }]] = await connection.execute('SELECT COUNT(*) AS totalColleges FROM colleges');
        const [[{ totalUsers }]] = await connection.execute('SELECT COUNT(*) AS totalUsers FROM users');
        const [[{ totalExams }]] = await connection.execute('SELECT COUNT(*) AS totalExams FROM exams');

        if (totalColleges === null || totalUsers === null || totalExams === null) {
            throw new Error('Error fetching platform stats');
        }

        res.json({ totalColleges, totalUsers, totalExams });
    } catch (error) {
        console.error('Platform overview error:', error);
        res.status(500).json({ message: 'Error fetching platform stats' });
    } finally {
        if (connection) await connection.end();
    }
};

// 2. Create College
const createCollege = async (req, res) => {
    let connection = null;
    try {
        const { name, email, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        const [existing] = await connection.execute(
            'SELECT * FROM colleges WHERE email = ?',
            [email]
        );

        if (existing && existing.length > 0) {
            return res.status(409).json({ message: 'College already exists' });
        }

        const [result] = await connection.execute(
            'INSERT INTO colleges (name, email, address, status) VALUES (?, ?, ?, ?)',
            [name, email, address, 'pending']
        );

        if (!result || !result.insertId) {
            throw new Error('Error creating college');
        }

        await connection.end();

        res.status(201).json({ message: 'College created', collegeId: result.insertId });
    } catch (error) {
        console.error('Create college error:', error);
        res.status(500).json({ message: 'Error creating college' });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
    }
};

// 3. Approve College
const approveCollege = async (req, res) => {
    let connection;
    try {
        const { collegeId } = req.params;

        if (!collegeId) {
            return res.status(400).json({ message: 'College ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        const [result] = await connection.execute(
            'UPDATE colleges SET status = ? WHERE college_id = ?',
            ['approved', collegeId]
        );

        if (!result || result.affectedRows === 0) {
            if (result === null) {
                throw new Error('College not found');
            } else {
                throw new Error('Error approving college');
            }
        }

        res.json({ message: 'College approved' });
    } catch (error) {
        console.error('Approve college error:', error);
        res.status(500).json({ message: 'Error approving college', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing database connection:', endError);
            }
        }
    }
};

// 4. Assign Admin
const assignAdminToCollege = async (req, res) => {
    let connection = null;
    try {
        const { collegeId, userId } = req.body;
        if (!collegeId || !userId) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        const [result] = await connection.execute(
            'UPDATE users SET role = ?, college_id = ? WHERE userId = ?',
            ['admin', collegeId, userId]
        );

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Admin assigned' });
    } catch (error) {
        console.error('Assign admin error:', error);
        res.status(500).json({ message: 'Error assigning admin', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// 5. Get All Colleges
const getAllColleges = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [colleges] = await connection.execute('SELECT * FROM colleges');
        if (!colleges || colleges.length === 0) {
            throw new Error('No colleges found');
        }
        res.json(colleges);
    } catch (error) {
        console.error('Get colleges error:', error);
        res.status(500).json({ message: 'Error fetching colleges', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// 6. Get College Details
const getCollegeDetails = async (req, res) => {
    let connection = null;
    try {
        const { collegeId } = req.params;

        if (!collegeId) {
            return res.status(400).json({ message: 'College ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);

        const [[college]] = await connection.execute('SELECT * FROM colleges WHERE college_id = ?', [collegeId]);

        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json(college);
    } catch (error) {
        console.error('College detail error:', error);
        res.status(500).json({ message: 'Error fetching college details', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// 7. Grant Feature Access
const grantFeatureAccess = async (req, res) => {
    let connection = null;
    try {
        const { collegeId, feature, access } = req.body;

        if (!collegeId || !feature || access === undefined) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        if (typeof collegeId !== 'string' || typeof feature !== 'string') {
            return res.status(400).json({ message: 'College ID and feature should be strings' });
        }

        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        const [result] = await connection.execute(`
            INSERT INTO college_features (college_id, feature, enabled)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)
        `, [collegeId, feature, access]);

        if (!result || result.affectedRows === 0) {
            throw new Error('Error updating feature access');
        }

        res.json({ message: `Feature '${feature}' updated` });
    } catch (error) {
        console.error('Feature grant error:', error);
        res.status(500).json({ message: 'Error updating feature access', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// 8. Remove College
const removeCollege = async (req, res) => {
    let connection = null;
    try {
        const { collegeId } = req.params;

        if (!collegeId) {
            return res.status(400).json({ message: 'College ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        // Check if college with given ID exists
        const [college] = await connection.execute('SELECT * FROM colleges WHERE college_id = ?', [collegeId]);
        if (!college || college.length === 0) {
            return res.status(404).json({ message: 'College not found' });
        }

        const [result] = await connection.execute('DELETE FROM colleges WHERE college_id = ?', [collegeId]);
        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json({ message: 'College removed' });
    } catch (error) {
        console.error('Remove college error:', error);
        res.status(500).json({ message: 'Error removing college', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// 9. View Usage Stats
const viewCollegeUsageStats = async (req, res) => {
    let connection = null;
    try {
        const { collegeId } = req.params;
        if (!collegeId) {
            return res.status(400).json({ message: 'College ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        const [[{ students }]] = await connection.execute(
            'SELECT COUNT(*) AS students FROM users WHERE college_id = ? AND role = "student"', [collegeId]
        );

        const [[{ exams }]] = await connection.execute(
            'SELECT COUNT(*) AS exams FROM exams WHERE college_id = ?', [collegeId]
        );

        if (students === undefined || students === null) {
            throw new Error('Failed to fetch student count');
        }
        if (exams === undefined || exams === null) {
            throw new Error('Failed to fetch exam count');
        }

        res.json({ students, exams });
    } catch (error) {
        console.error('College usage error:', error);
        res.status(500).json({ message: 'Error fetching usage stats', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// 10. View Revenue Stats (Optional)
const viewRevenueStats = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        const [stats] = await connection.execute(`
            SELECT college_id, SUM(payment_amount) AS totalRevenue
            FROM payments
            GROUP BY college_id
        `);

        if (!stats || !Array.isArray(stats) || stats.length === 0) {
            return res.status(404).json({ message: 'No revenue data found' });
        }

        res.json(stats);
    } catch (error) {
        console.error('Revenue stats error:', error);
        res.status(500).json({ message: 'Error fetching revenue data', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Block/deactivate college
const blockCollege = async (req, res) => {
    let connection = null;
    try {
        const { collegeId } = req.params;
        if (!collegeId) {
            return res.status(400).json({ message: 'collegeId is required' });
        }

        connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            'UPDATE colleges SET status = ? WHERE college_id = ?',
            ['blocked', collegeId]
        );

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json({ message: 'College blocked', collegeId });
    } catch (error) {
        console.error('Block college error:', error);
        res.status(500).json({ message: 'Error blocking college', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Block/deactivate user
const blockUser = async (req, res) => {
    let connection = null;
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            throw new Error('Unable to connect to database');
        }

        const [result] = await connection.execute(
            'UPDATE users SET status = ? WHERE userId = ?',
            ['blocked', userId]
        );

        if (!result || result.affectedRows === 0) {
            await connection.end();
            return res.status(404).json({ message: 'User not found' });
        }

        await connection.end();
        res.json({ message: 'User blocked', userId });
    } catch (error) {
        console.error('Block user error:', error);
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
        res.status(500).json({ message: 'Error blocking user', error: error.message });
    }
};

// Get multi-tenancy isolation setting for a college
const getMultiTenancyIsolation = async (req, res) => {
    const { collegeId } = req.params;
    if (!collegeId) {
        return res.status(400).json({ message: 'collegeId required' });
    }
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [[row]] = await connection.execute('SELECT multi_tenancy_isolation FROM colleges WHERE id = ?', [collegeId]);
        if (!row) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.json({ collegeId, multiTenancyIsolation: !!row.multi_tenancy_isolation });
    } catch (err) {
        console.error('Error fetching isolation setting:', err);
        res.status(500).json({ message: 'Error fetching isolation setting', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Set multi-tenancy isolation for a college
const setMultiTenancyIsolation = async (req, res) => {
    const { collegeId } = req.params;
    const { isolation } = req.body;
    if (!collegeId || isolation === undefined) {
        return res.status(400).json({ message: 'collegeId and isolation required' });
    }

    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('UPDATE colleges SET multi_tenancy_isolation = ? WHERE id = ?', [isolation ? 1 : 0, collegeId]);
        if (!result || result.affectedRows === 0) {
            throw new Error('College not found or unable to update');
        }
        await connection.end();
        res.json({ collegeId, multiTenancyIsolation: !!isolation });
    } catch (err) {
        console.error('Error updating isolation setting:', err);
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
        res.status(500).json({ message: 'Error updating isolation setting', error: err.message });
    }
};

module.exports = {
    getPlatformOverview,
    createCollege,
    approveCollege,
    assignAdminToCollege,
    getAllColleges,
    getCollegeDetails,
    grantFeatureAccess,
    removeCollege,
    viewCollegeUsageStats,
    viewRevenueStats,
    blockCollege,
    blockUser,
    getMultiTenancyIsolation,
    setMultiTenancyIsolation
};
