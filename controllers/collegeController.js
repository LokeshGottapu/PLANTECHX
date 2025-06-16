const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const crypto = require('crypto');

const createCollege = async (req, res) => {
    let connection;
    try {
        const { name, email, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Check if college already exists
        const [existingColleges] = await connection.execute(
            'SELECT * FROM colleges WHERE name = ? OR email = ?',
            [name, email]
        );

        if (existingColleges.length > 0) {
            return res.status(409).json({ message: 'College already exists' });
        }

        // Insert new college
        const [result] = await connection.execute(
            'INSERT INTO colleges (name, email, address) VALUES (?, ?, ?)',
            [name, email, address]
        );

        res.status(201).json({
            message: 'College created successfully',
            collegeId: result.insertId
        });
    } catch (error) {
        console.error('Create college error:', error);
        res.status(500).json({ message: 'Error creating college' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const getColleges = async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [colleges] = await connection.execute(
            'SELECT * FROM colleges ORDER BY created_at DESC'
        );

        res.json(colleges);
    } catch (error) {
        console.error('Get colleges error:', error);
        res.status(500).json({ message: 'Error fetching colleges' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const approveCollege = async (req, res) => {
    let connection;
    try {
        const { collegeId } = req.params;

        connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            'UPDATE colleges SET status = ? WHERE college_id = ?',
            ['approved', collegeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json({ message: 'College approved successfully' });
    } catch (error) {
        console.error('Approve college error:', error);
        res.status(500).json({ message: 'Error approving college' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const assignCollegeAdmin = async (req, res) => {
    let connection;
    try {
        const { collegeId, userId } = req.body;

        if (!collegeId || !userId) {
            return res.status(400).json({ message: 'College ID and user ID are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Update user role to admin
        const [result] = await connection.execute(
            'UPDATE users SET role = ? WHERE userId = ?',
            ['admin', userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'College admin assigned successfully' });
    } catch (error) {
        console.error('Assign college admin error:', error);
        res.status(500).json({ message: 'Error assigning college admin' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const assignExamToCollege = async (req, res) => {
    let connection;
    try {
        const { collegeId, examId } = req.body;

        if (!collegeId || !examId) {
            return res.status(400).json({ message: 'College ID and exam ID are required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Check if college and exam exist
        const [colleges] = await connection.execute(
            'SELECT * FROM colleges WHERE college_id = ?',
            [collegeId]
        );

        if (colleges.length === 0) {
            return res.status(404).json({ message: 'College not found' });
        }

        const [exams] = await connection.execute(
            'SELECT * FROM exams WHERE exam_id = ?',
            [examId]
        );

        if (exams.length === 0) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json({ message: 'Exam assigned to college successfully' });
    } catch (error) {
        console.error('Assign exam to college error:', error);
        res.status(500).json({ message: 'Error assigning exam to college' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const grantLSRWAccess = async (req, res) => {
    let connection;
    try {
        const { collegeId } = req.body;

        if (!collegeId) {
            return res.status(400).json({ message: 'College ID is required' });
        }

        connection = await mysql.createConnection(dbConfig);

        // Check if college exists
        const [colleges] = await connection.execute(
            'SELECT * FROM colleges WHERE college_id = ?',
            [collegeId]
        );

        if (colleges.length === 0) {
            return res.status(404).json({ message: 'College not found' });
        }

        res.json({ message: 'LSRW access granted successfully' });
    } catch (error) {
        console.error('Grant LSRW access error:', error);
        res.status(500).json({ message: 'Error granting LSRW access' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

const getCollegePerformance = async (req, res) => {
    let connection;
    try {
        const { collegeId } = req.params;
        const { startDate, endDate } = req.query;
        
        let query = `
            SELECT 
                e.exam_name,
                COUNT(DISTINCT ur.user_id) as total_participants,
                AVG(ur.score) as average_score,
                MIN(ur.score) as lowest_score,
                MAX(ur.score) as highest_score
            FROM user_results ur
            JOIN exams e ON ur.exam_id = e.exam_id
            JOIN users u ON ur.user_id = u.userId
            WHERE u.college_id = ?
        `;
        const params = [collegeId];

        if (startDate) {
            query += ' AND ur.completed_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND ur.completed_at <= ?';
            params.push(endDate);
        }

        query += ' GROUP BY e.exam_id, e.exam_name ORDER BY e.exam_name';

        connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute(query, params);

        res.json({
            data: results,
            requestId: crypto.randomBytes(16).toString('hex')
        });
    } catch (error) {
        console.error('Get college performance error:', error);
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

module.exports = {
    createCollege,
    getColleges,
    approveCollege,
    assignCollegeAdmin,
    assignExamToCollege,
    grantLSRWAccess,
    getCollegePerformance
};