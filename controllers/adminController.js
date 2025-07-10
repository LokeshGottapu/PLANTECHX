// Admin Controller

const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

// Register a new student under that admin’s college
const createStudent = async (req, res) => {
    const { name, email, password, collegeId } = req.body;
    if (!name || !email || !password || !collegeId) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            return res.status(500).json({ message: 'Error connecting to database' });
        }
        // Check if student already exists
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existing.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'Student already exists' });
        }
        // Insert student (role: student)
        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role, college_id) VALUES (?, ?, ?, ?, ?)', 
            [name, email, password, 'student', collegeId]
        );
        if (!result || !result.insertId) {
            await connection.end();
            return res.status(500).json({ message: 'Error creating student' });
        }
        await connection.end();
        res.json({ message: 'Student created' });
    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({ message: 'Error creating student', error: err.message });
    }
};

// Fetch all students managed by the admin
const getAllStudents = async (req, res) => {
    const { collegeId } = req.query; // Or get from admin's session
    if (!collegeId) return res.status(400).json({ message: 'collegeId is required' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            return res.status(500).json({ message: 'Error connecting to database' });
        }

        const [students] = await connection.execute(
            'SELECT id, name, email FROM users WHERE role = ? AND college_id = ?',
            ['student', collegeId]
        );

        if (!students || students.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'No students found' });
        }

        await connection.end();
        res.json({ students });
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ message: 'Error fetching students', error: err?.message });
    }
};

// Upload and save PDF/video links to DB
const uploadStudyMaterial = async (req, res) => {
    const { title, type, url, collegeId } = req.body;
    if (!title || !type || !url || !collegeId) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            return res.status(500).json({ message: 'Error connecting to database' });
        }

        const [result] = await connection.execute(
            'INSERT INTO study_materials (title, type, url, college_id) VALUES (?, ?, ?, ?)', 
            [title, type, url, collegeId]
        );
        if (!result || !result.insertId) {
            await connection.end();
            return res.status(500).json({ message: 'Error uploading study material' });
        }
        await connection.end();
        res.json({ message: 'Study material uploaded' });
    } catch (err) {
        console.error('Error uploading study material:', err);
        res.status(500).json({ message: 'Error uploading study material', error: err?.message });
    }
};

// Save announcements to show on user dashboard
const sendNotification = async (req, res) => {
    const { message, collegeId } = req.body;
    if (!message || !collegeId) {
        return res.status(400).json({ message: 'Message and collegeId are required' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            return res.status(500).json({ message: 'Error connecting to database' });
        }

        await connection.execute(
            'INSERT INTO notifications (message, college_id, created_at) VALUES (?, ?, NOW())',
            [message, collegeId]
        );
        await connection.end();
        res.json({ message: 'Notification sent' });
    } catch (err) {
        console.error('Error sending notification:', err);
        res.status(500).json({ message: 'Error sending notification', error: err?.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// View student exam performance data
const getStudentPerformance = async (req, res) => {
    const { studentId } = req.query;
    if (!studentId) {
        return res.status(400).json({ message: 'studentId is required' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            return res.status(500).json({ message: 'Error connecting to database' });
        }

        const [performance] = await connection.execute(
            `SELECT e.title AS exam, r.score, r.attempted_at
             FROM results r
             JOIN exams e ON r.exam_id = e.id
             WHERE r.user_id = ?`,
            [studentId]
        );

        if (!performance || performance.length === 0) {
            return res.status(404).json({ message: 'No performance data found' });
        }

        res.json({ performance });
    } catch (err) {
        console.error('Error fetching student performance:', err);
        res.status(500).json({ message: 'Error fetching student performance', error: err.message });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Existing functions
const getDashboard = async (req, res) => {
    if (!req || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        if (!req.user || !req.user.id) {
            throw new Error('Missing user ID');
        }

        res.json({ message: 'Admin dashboard' });
    } catch (err) {
        console.error('Error fetching dashboard:', err);
        res.status(500).json({ message: 'Error fetching dashboard', error: err?.message });
    }
};

const manageStudents = async (req, res) => {
    if (!req || !req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        if (!req.user || !req.user.id) {
            throw new Error('Missing user ID');
        }

        res.json({ message: 'Manage students' });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Error managing students:', err.message, err.stack);
        } else {
            console.error('Error managing students:', err);
        }

        res.status(500).json({ message: 'Error managing students', error: err?.message });
    }
};

const manageExams = async (req, res) => {
    try {
        if (!req || !req.user) {
            throw new Error('Unauthorized');
        }
        if (!req.user || !req.user.id) {
            throw new Error('Missing user ID');
        }
        res.json({ message: 'Manage exams' });
    } catch (err) {
        if (err instanceof Error) {
            console.error('Error managing exams:', err.message, err.stack);
        } else {
            console.error('Error managing exams:', err);
        }
        res.status(500).json({ message: 'Error managing exams', error: err?.message });
    }
};

// Assign exam to student or batch
const assignExamToStudentOrBatch = async (req, res) => {
    const { examId, studentIds, batchIds } = req.body;
    if (!examId || (!studentIds && !batchIds)) {
        return res.status(400).json({ message: 'examId and studentIds or batchIds are required' });
    }
    // Example response
    res.json({ message: 'Exam assigned', examId, studentIds, batchIds });
};

module.exports = {
    getDashboard,
    manageStudents,
    manageExams,
    createStudent,
    getAllStudents,
    uploadStudyMaterial,
    sendNotification,
    getStudentPerformance,
    assignExamToStudentOrBatch
};