const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const collegeModel = require('../models/collegeModel');

module.exports = {
    // College Management
    createCollege: async (req, res) => {
        let connection;
        try {
            const { name, address, contact_email, contact_phone } = req.body;

            if (!name || !address || !contact_email) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contact_email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            connection = await mysql.createConnection(dbConfig);

            // Check if college already exists
            const [existingColleges] = await connection.execute(
                'SELECT * FROM colleges WHERE name = ?',
                [name]
            );

            if (existingColleges.length > 0) {
                return res.status(409).json({ message: 'College already exists' });
            }

            const [result] = await connection.execute(
                'INSERT INTO colleges (name, address, contact_email, contact_phone, status) VALUES (?, ?, ?, ?, ?)',
                [name, address, contact_email, contact_phone, 'pending']
            );

            res.status(201).json({
                message: 'College created successfully',
                collegeId: result.insertId
            });
        } catch (error) {
            console.error('Error creating college:', error);
            res.status(500).json({ message: 'Error creating college' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    approveCollege: async (req, res) => {
        let connection;
        try {
            const { collegeId } = req.params;

            connection = await mysql.createConnection(dbConfig);

            const [result] = await connection.execute(
                'UPDATE colleges SET status = ? WHERE id = ?',
                ['approved', collegeId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'College not found' });
            }

            res.json({
                message: 'College approved successfully'
            });
        } catch (error) {
            console.error('Error approving college:', error);
            res.status(500).json({ message: 'Error approving college' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    getColleges: async (req, res) => {
        let connection;
        try {
            connection = await mysql.createConnection(dbConfig);

            const [colleges] = await connection.execute(
                'SELECT * FROM colleges'
            );

            res.json({
                message: 'Colleges retrieved successfully',
                colleges
            });
        } catch (error) {
            console.error('Error retrieving colleges:', error);
            res.status(500).json({ message: 'Error retrieving colleges' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // CEO and Team Management
    assignCollegeAdmin: async (req, res) => {
        try {
            const { userId, collegeId, role } = req.body;
            await collegeModel.assignCollegeAdmin(userId, collegeId, role);
            res.json({ message: 'College admin assigned successfully' });
        } catch (error) {
            console.error('Assign admin error:', error);
            res.status(500).json({ message: 'Error assigning college admin' });
        }
    },

    // Exam Management
    assignExamToCollege: async (req, res) => {
        try {
            const { examId, collegeId, startDate, endDate } = req.body;
            await collegeModel.assignExamToCollege(examId, collegeId, startDate, endDate);
            res.json({ message: 'Exam assigned to college successfully' });
        } catch (error) {
            console.error('Assign exam error:', error);
            res.status(500).json({ message: 'Error assigning exam to college' });
        }
    },

    // LSRW Access Management
    grantLSRWAccess: async (req, res) => {
        try {
            const { collegeId, accessLevel } = req.body;
            await collegeModel.grantLSRWAccess(collegeId, accessLevel);
            res.json({ message: 'LSRW access granted successfully' });
        } catch (error) {
            console.error('Grant LSRW access error:', error);
            res.status(500).json({ message: 'Error granting LSRW access' });
        }
    },

    // Analytics and Reports
    getCollegePerformance: async (req, res) => {
        try {
            const { collegeId } = req.params;
            const { startDate, endDate } = req.query;
            const performance = await collegeModel.getCollegePerformance(collegeId, { startDate, endDate });
            res.json(performance);
        } catch (error) {
            console.error('Get performance error:', error);
            res.status(500).json({ message: 'Error fetching college performance' });
        }
    }
};