// Admin Controller

const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const Course = require('../models/course');
const FeatureToggle = require('../models/featureToggle');
const FacultyApproval = require('../models/facultyApproval');
const ExamApproval = require('../models/examApproval');
const ContentApproval = require('../models/contentApproval');
const Permission = require('../models/permission');
const ExcelJS = require('exceljs');
const AuditLog = require('../models/auditLog');
const FAQ = require('../models/faq');
const IntegrationSetting = require('../models/integrationSetting');

// In-memory AI config (replace with DB if needed)
let aiConfig = { difficultyLogic: 'default' };

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

    if (!examId || examId === null || examId === undefined) {
        return res.status(400).json({ message: 'examId is required' });
    }

    if (!studentIds && !batchIds) {
        return res.status(400).json({ message: 'studentIds or batchIds are required' });
    }

    try {
        // Assign exam to student or batch
        // Example response
        res.json({ message: 'Exam assigned', examId, studentIds, batchIds });
    } catch (error) {
        console.error('Error assigning exam to student or batch:', error);
        res.status(500).json({ message: 'Error assigning exam', error: error.message });
    }
};

// Create a batch
const createBatch = async (req, res) => {
    const { name, collegeId } = req.body;
    if (!name || !collegeId) return res.status(400).json({ message: 'name and collegeId required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        const [result] = await connection.execute('INSERT INTO batches (name, collegeId) VALUES (?, ?)', [name, collegeId]);
        if (!result || !result.insertId) {
            throw new Error('Error inserting batch');
        }
        res.json({ message: 'Batch created', batchId: result.insertId });
    } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ message: 'Error creating batch', error: error.message });
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

// List all batches for a college
const listBatches = async (req, res) => {
    const { collegeId } = req.query;
    if (!collegeId) {
        return res.status(400).json({ message: 'collegeId required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        const [batches] = await connection.execute('SELECT * FROM batches WHERE collegeId = ?', [collegeId]);
        if (!batches) {
            throw new Error('Error fetching batches');
        }
        await connection.end();
        res.json({ batches });
    } catch (error) {
        console.error('Error listing batches:', error);
        res.status(500).json({ message: 'Error listing batches', error: error.message });
    }
};

// Delete a batch
const deleteBatch = async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) return res.status(400).json({ message: 'batchId required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        await connection.execute('DELETE FROM batches WHERE id = ?', [batchId]);
        await connection.execute('DELETE FROM batch_students WHERE batchId = ?', [batchId]);
        await connection.execute('DELETE FROM batch_exams WHERE batchId = ?', [batchId]);
        await connection.end();
        res.json({ message: 'Batch deleted' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({ message: 'Error deleting batch', error: error.message });
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

// Assign students to batch
const assignStudentsToBatch = async (req, res) => {
    const { batchId, studentIds } = req.body;
    if (!batchId || !Array.isArray(studentIds)) return res.status(400).json({ message: 'batchId and studentIds required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        for (const studentId of studentIds) {
            if (!studentId) {
                throw new Error('Student ID is null or undefined');
            }
            await connection.execute('INSERT INTO batch_students (batchId, studentId) VALUES (?, ?)', [batchId, studentId]);
        }
        await connection.end();
        res.json({ message: 'Students assigned to batch' });
    } catch (error) {
        console.error('Error assigning students:', error);
        res.status(500).json({ message: 'Error assigning students', error: error.message });
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

// Assign exams to batch
const assignExamsToBatch = async (req, res) => {
    const { batchId, examIds } = req.body;
    if (!batchId || !Array.isArray(examIds)) return res.status(400).json({ message: 'batchId and examIds required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        for (const examId of examIds) {
            if (!examId) {
                throw new Error('Exam ID is null or undefined');
            }
            await connection.execute('INSERT INTO batch_exams (batchId, examId) VALUES (?, ?)', [batchId, examId]);
        }
        await connection.end();
        res.json({ message: 'Exams assigned to batch' });
    } catch (error) {
        console.error('Error assigning exams:', error);
        res.status(500).json({ message: 'Error assigning exams', error: error.message });
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

// List students in a batch
const listBatchStudents = async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) return res.status(400).json({ message: 'batchId required' });

    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        const [students] = await connection.execute(
            'SELECT u.* FROM batch_students bs JOIN users u ON bs.studentId = u.id WHERE bs.batchId = ?', [batchId]
        );
        if (!students || !students.length) {
            throw new Error('No students found in batch');
        }
        await connection.end();
        res.json({ students });
    } catch (error) {
        console.error('Error listing batch students:', error);
        res.status(500).json({ message: 'Error listing batch students', error: error.message });
    }
};

// List exams in a batch
const listBatchExams = async (req, res) => {
    const { batchId } = req.params;
    if (!batchId) {
        return res.status(400).json({ message: 'batchId required' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }
        const [exams] = await connection.execute(
            'SELECT e.* FROM batch_exams be JOIN exams e ON be.examId = e.id WHERE be.batchId = ?', [batchId]
        );
        if (!exams || !exams.length) {
            throw new Error('No exams found in batch');
        }
        await connection.end();
        res.json({ exams });
    } catch (error) {
        console.error('Error listing batch exams:', error);
        res.status(500).json({ message: 'Error listing batch exams', error: error.message });
    }
};

// Create a course
const createCourse = async (req, res) => {
    const { name, description, status } = req.body;
    const created_by = req.user && req.user.id;
    if (!name || !description || !created_by) {
        return res.status(400).json({
            message: 'name, description and created_by are required',
        });
    }
    try {
        const courseId = await Course.create({ name, description, status, created_by });
        res.json({ message: 'Course created', courseId });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
};

// Update a course
const updateCourse = async (req, res) => {
    const { courseId } = req.params;
    const { name, description, status } = req.body;
    if (!courseId || !name || !description) return res.status(400).json({ message: 'All fields required' });
    try {
        const course = await Course.get(courseId);
        if (!course) {
            throw new Error('Course not found');
        }
        await Course.update(courseId, { name, description, status });
        res.json({ message: 'Course updated' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
};

// Delete a course
const deleteCourse = async (req, res) => {
    const { courseId } = req.params;
    if (!courseId) {
        return res.status(400).json({ message: 'courseId required' });
    }

    try {
        const course = await Course.get(courseId);

        if (!course) {
            throw new Error('Course not found');
        }

        await Course.delete(courseId);

        res.json({ message: 'Course deleted' });
    } catch (error) {
        console.error('Error deleting course:', error);

        if (error.message === 'Course not found') {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
};

// List all courses
const listCourses = async (req, res) => {
    try {
        const courses = await Course.getAll();
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No courses found' });
        }
        res.json({ courses });
    } catch (error) {
        console.error('Error listing courses:', error);
        res.status(500).json({ message: 'Error listing courses', error: error.message });
    }
};

// Assign course to batch
const assignCourseToBatch = async (req, res) => {
    const { courseId, batchId } = req.body;
    if (!courseId || !batchId) return res.status(400).json({ message: 'courseId and batchId required' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        await connection.execute('INSERT INTO batch_courses (batchId, courseId) VALUES (?, ?)', [batchId, courseId]);

        await connection.end();

        res.json({ message: 'Course assigned to batch' });
    } catch (error) {
        console.error('Assign course to batch error:', error);
        res.status(500).json({ message: 'Error assigning course', error: error.message });
    }
};

// Set feature toggle (enable/disable LSRW, SWOT, AI)
const setFeatureToggle = async (req, res) => {
    const { feature, enabled, collegeId, userId } = req.body;
    if (!feature || typeof enabled === 'undefined' || (!collegeId && !userId)) {
        return res.status(400).json({ message: 'feature, enabled, and collegeId or userId are required' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        await FeatureToggle.set({ feature, enabled, collegeId, userId });
        res.json({ message: 'Feature toggle updated' });
    } catch (err) {
        console.error('Error updating feature toggle:', err);
        res.status(500).json({ message: 'Error updating feature toggle', error: err.message });
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

// Get feature toggle status
const getFeatureToggle = async (req, res) => {
    const { feature, collegeId, userId } = req.query;
    if (!feature || (!collegeId && !userId)) {
        return res.status(400).json({ message: 'feature and collegeId or userId are required' });
    }
    try {
        const enabled = await FeatureToggle.get({ feature, collegeId, userId });
        if (enabled === null || enabled === undefined) {
            return res.status(404).json({ message: 'Feature toggle not set' });
        }
        res.json({ feature, enabled });
    } catch (err) {
        console.error('Error fetching feature toggle:', err);
        res.status(500).json({ message: 'Error fetching feature toggle', error: err.message });
    }
};

// List all feature toggles for a college or user
const listFeatureToggles = async (req, res) => {
    const { collegeId, userId } = req.query;

    if (!collegeId && !userId) {
        return res.status(400).json({ message: 'collegeId or userId required' });
    }

    try {
        const toggles = await FeatureToggle.list({ collegeId, userId });

        if (!toggles) {
            return res.status(404).json({ message: 'Feature toggles not found' });
        }

        res.json({ toggles });
    } catch (err) {
        console.error('Error listing feature toggles:', err);
        res.status(500).json({ message: 'Error listing feature toggles', error: err.message });
    }
};

// Faculty approval endpoints
const requestFacultyApproval = async (req, res) => {
    const { facultyId } = req.body;
    if (!facultyId) {
        return res.status(400).json({ message: 'facultyId required' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            return res.status(500).json({ message: 'Error connecting to database' });
        }

        const [faculty] = await connection.execute(
            'SELECT * FROM faculty WHERE id = ?',
            [facultyId]
        );

        if (!faculty || faculty.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Faculty not found' });
        }

        await FacultyApproval.request(facultyId);
        res.json({ message: 'Faculty approval requested' });
    } catch (err) {
        console.error('Error requesting faculty approval:', err);
        res.status(500).json({ message: 'Error requesting approval', error: err.message });
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
const reviewFacultyApproval = async (req, res) => {
    const { id, status, reviewedBy, remarks } = req.body;
    if (!id || !status || !reviewedBy) {
        return res.status(400).json({ message: 'id, status, reviewedBy required' });
    }
    try {
        const approval = await FacultyApproval.getById(id);
        if (!approval) {
            return res.status(404).json({ message: 'Approval not found' });
        }
        await FacultyApproval.review({ id, status, reviewedBy, remarks });
        res.json({ message: 'Faculty approval reviewed' });
    } catch (err) {
        console.error('Error reviewing approval:', err);
        res.status(500).json({ message: 'Error reviewing approval', error: err.message });
    }
};
const listFacultyApprovals = async (req, res) => {
    const { status } = req.query;
    if (status === undefined || status === null) {
        return res.status(400).json({ message: 'status is a required query parameter' });
    }
    try {
        const approvals = await FacultyApproval.getAll(status);
        if (!approvals) {
            return res.status(404).json({ message: 'No approvals found' });
        }
        res.json({ approvals });
    } catch (err) {
        console.error('Error listing approvals:', err);
        res.status(500).json({ message: 'Error listing approvals', error: err.message });
    }
};

// Exam approval endpoints
const requestExamApproval = async (req, res) => {
    const { examId } = req.body;
    if (!examId) {
        return res.status(400).json({ message: 'examId required' });
    }
    try {
        await ExamApproval.request(examId);
        res.json({ message: 'Exam approval requested' });
    } catch (err) {
        if (!err.message) {
            console.error('requestExamApproval error:', err);
        }
        res.status(500).json({ message: 'Error requesting approval', error: err.message });
    }
};
const reviewExamApproval = async (req, res) => {
    const { id, status, reviewedBy, remarks } = req.body;
    if (!id || !status || !reviewedBy) {
        return res.status(400).json({ message: 'id, status, reviewedBy required' });
    }
    try {
        const approval = await ExamApproval.getById(id);
        if (!approval) {
            return res.status(404).json({ message: 'Approval not found' });
        }
        await ExamApproval.review({ id, status, reviewedBy, remarks });
        res.json({ message: 'Exam approval reviewed' });
    } catch (err) {
        if (!err.message) {
            console.error('reviewExamApproval error:', err);
        }
        res.status(500).json({ message: 'Error reviewing approval', error: err.message });
    }
};
const listExamApprovals = async (req, res) => {
    const { status } = req.query;
    try {
        const approvals = await ExamApproval.getAll(status || 'pending');
        if (!approvals) {
            return res.status(404).json({ message: 'No approvals found' });
        }
        res.json({ approvals });
    } catch (err) {
        console.error('listExamApprovals error:', err);
        res.status(500).json({ message: 'Error listing approvals', error: err.message });
    }
};

// Content approval endpoints
const requestContentApproval = async (req, res) => {
    const { contentId } = req.body;
    if (!contentId) return res.status(400).json({ message: 'contentId required' });

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        const content = await connection.execute('SELECT * FROM content WHERE id = ?', [contentId]);
        if (!content || content.length === 0) {
            return res.status(404).json({ message: 'Content not found' });
        }

        await ContentApproval.request(contentId);
        res.json({ message: 'Content approval requested' });
    } catch (err) {
        console.error('Error requesting content approval:', err);
        res.status(500).json({ message: 'Error requesting approval', error: err.message });
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
const reviewContentApproval = async (req, res) => {
    const { id, status, reviewedBy, remarks } = req.body;
    if (!id || !status || !reviewedBy) return res.status(400).json({ message: 'id, status, reviewedBy required' });

    try {
        const approval = await ContentApproval.getById(id);
        if (!approval) {
            return res.status(404).json({ message: 'Approval not found' });
        }
        await ContentApproval.review({ id, status, reviewedBy, remarks });
        res.json({ message: 'Content approval reviewed' });
    } catch (err) {
        if (!err.message) {
            console.error('reviewContentApproval error:', err);
        }
        res.status(500).json({ message: 'Error reviewing approval', error: err.message });
    }
};
const listContentApprovals = async (req, res) => {
    const { status } = req.query;
    if (!status) return res.status(400).json({ message: 'status is a required query parameter' });
    try {
        const approvals = await ContentApproval.getAll(status);
        if (!approvals) {
            return res.status(404).json({ message: 'No approvals found' });
        }
        res.json({ approvals });
    } catch (err) {
        console.error('Error listing approvals:', err);
        res.status(500).json({ message: 'Error listing approvals', error: err.message });
    }
};

// Grant permission
const grantPermission = async (req, res) => {
    const { userId, resourceType, resourceId, permission, grantedBy } = req.body;
    if (!userId || !resourceType || !permission || grantedBy === undefined) return res.status(400).json({ message: 'userId, resourceType, permission, grantedBy required' });
    if (typeof userId !== 'string' || typeof resourceType !== 'string' || typeof permission !== 'string') return res.status(400).json({ message: 'userId, resourceType, permission must be strings' });
    if (resourceId !== undefined && typeof resourceId !== 'string') return res.status(400).json({ message: 'resourceId must be a string' });
    try {
        await Permission.grant({ userId, resourceType, resourceId, permission, grantedBy });
        res.json({ message: 'Permission granted' });
    } catch (err) {
        const { message } = err;
        if (message === 'Error: ENOTFOUND: getaddrinfo ENOTFOUND') {
            return res.status(503).json({ message: 'Database connection failed. Please try again later.' });
        }
        if (message === 'Error: ER_NO_SUCH_TABLE: Table \'plantechx.permissions\' doesn\'t exist') {
            return res.status(500).json({ message: 'Error granting permission', error: 'Database table permissions does not exist. Please create it and try again.' });
        }
        return res.status(500).json({ message: 'Error granting permission', error: err.message });
    }
};
// Revoke permission
const revokePermission = async (req, res) => {
    const { userId, resourceType, resourceId, permission } = req.body;
    if (!userId || !resourceType || !permission) {
        return res.status(400).json({ message: 'userId, resourceType, permission required' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        await Permission.revoke({ userId, resourceType, resourceId, permission });
        res.json({ message: 'Permission revoked' });
    } catch (err) {
        console.error('Error revoking permission:', err);
        res.status(500).json({ message: 'Error revoking permission', error: err.message });
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
// Check permission
const checkPermission = async (req, res) => {
    const { userId, resourceType, resourceId, permission } = req.query;
    if (!userId || !resourceType || !permission) {
        return res.status(400).json({ message: 'userId, resourceType, permission required' });
    }
    try {
        if (typeof userId !== 'string' || typeof resourceType !== 'string' || typeof permission !== 'string') {
            throw new Error('userId, resourceType, permission must be strings');
        }
        if (resourceId !== undefined && typeof resourceId !== 'string') {
            throw new Error('resourceId must be a string');
        }
        const hasPermission = await Permission.check({ userId, resourceType, resourceId, permission });
        res.json({ hasPermission });
    } catch (err) {
        if (!err.message) {
            console.error('Error checking permission:', err);
        }
        res.status(500).json({ message: 'Error checking permission', error: err.message });
    }
};
// List permissions
const listPermissions = async (req, res) => {
    const { userId, resourceType } = req.query;
    if (!userId || !resourceType) {
        return res.status(400).json({ message: 'userId, resourceType required' });
    }
    try {
        if (typeof userId !== 'string' || typeof resourceType !== 'string') {
            throw new Error('userId, resourceType must be strings');
        }
        const permissions = await Permission.list({ userId, resourceType });
        if (!permissions || !Array.isArray(permissions)) {
            throw new Error('Permissions not found');
        }
        res.json({ permissions });
    } catch (err) {
        console.error('Error listing permissions:', err);
        res.status(500).json({ message: 'Error listing permissions', error: err.message });
    }
};

// Export students to Excel
const exportStudentsExcel = async (req, res) => {
    const { collegeId } = req.query;
    if (!collegeId) return res.status(400).json({ message: 'collegeId required' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) throw new Error('Failed to connect to database');
        const [students] = await connection.execute('SELECT id, name, email FROM users WHERE role = ? AND college_id = ?', ['student', collegeId]);
        await connection.end();
        if (!Array.isArray(students)) throw new Error('Failed to fetch students');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Students');
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 }
        ];
        students.forEach(s => sheet.addRow(s));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        if (!err.message) console.error('Error exporting students:', err);
        res.status(500).json({ message: 'Error exporting students', error: err.message });
    }
};

// Export results to Excel
const exportResultsExcel = async (req, res) => {
    const { collegeId } = req.query;
    if (!collegeId) return res.status(400).json({ message: 'collegeId required' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Failed to connect to database');
        }
        const [results] = await connection.execute(
            `SELECT r.id, u.name AS student, e.title AS exam, r.score, r.attempted_at
             FROM results r
             JOIN users u ON r.user_id = u.id
             JOIN exams e ON r.exam_id = e.id
             WHERE u.college_id = ?`, [collegeId]
        );
        await connection.end();
        if (!Array.isArray(results)) {
            throw new Error('Failed to fetch results');
        }
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Results');
        sheet.columns = [
            { header: 'Result ID', key: 'id', width: 10 },
            { header: 'Student', key: 'student', width: 30 },
            { header: 'Exam', key: 'exam', width: 30 },
            { header: 'Score', key: 'score', width: 10 },
            { header: 'Attempted At', key: 'attempted_at', width: 25 }
        ];
        results.forEach(r => {
            if (r && typeof r === 'object') {
                sheet.addRow(r);
            }
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=results.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        if (!err.message) {
            console.error('Error exporting results:', err);
        }
        res.status(500).json({ message: 'Error exporting results', error: err.message });
    }
};

// Export analytics to Excel (example: batch performance)
const exportBatchAnalyticsExcel = async (req, res) => {
    const { batchId } = req.query;
    if (!batchId) return res.status(400).json({ message: 'batchId required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [analytics] = await connection.execute(
            `SELECT u.name AS student, e.title AS exam, r.score, r.attempted_at
             FROM batch_students bs
             JOIN users u ON bs.studentId = u.id
             JOIN results r ON r.user_id = u.id
             JOIN exams e ON r.exam_id = e.id
             WHERE bs.batchId = ?`, [batchId]
        );

        if (!analytics || !Array.isArray(analytics)) {
            throw new Error('Failed to fetch analytics data');
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Batch Analytics');
        sheet.columns = [
            { header: 'Student', key: 'student', width: 30 },
            { header: 'Exam', key: 'exam', width: 30 },
            { header: 'Score', key: 'score', width: 10 },
            { header: 'Attempted At', key: 'attempted_at', width: 25 }
        ];

        analytics.forEach(a => {
            if (a && typeof a === 'object') {
                sheet.addRow(a);
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=batch_analytics.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error exporting analytics:', err);
        res.status(500).json({ message: 'Error exporting analytics', error: err.message });
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

// Batch performance analytics
const getBatchPerformance = async (req, res) => {
    const { batchId } = req.query;
    if (!batchId) return res.status(400).json({ message: 'batchId required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT e.title AS exam, AVG(r.score) AS avg_score, COUNT(r.id) AS attempts
             FROM batch_exams be
             JOIN exams e ON be.examId = e.id
             JOIN results r ON r.exam_id = e.id
             WHERE be.batchId = ?
             GROUP BY e.id`, [batchId]
        );
        if (!rows || rows.length === 0) {
            throw new Error('No batch performance data found');
        }
        await connection.end();
        res.json({ performance: rows });
    } catch (err) {
        console.error('Error fetching batch performance:', err);
        res.status(500).json({ message: 'Error fetching batch performance', error: err.message });
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
// Course performance analytics
const getCoursePerformance = async (req, res) => {
    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ message: 'courseId required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT e.title AS exam, AVG(r.score) AS avg_score, COUNT(r.id) AS attempts
             FROM batch_courses bc
             JOIN batches b ON bc.batchId = b.id
             JOIN batch_exams be ON be.batchId = b.id
             JOIN exams e ON be.examId = e.id
             JOIN results r ON r.exam_id = e.id
             WHERE bc.courseId = ?
             GROUP BY e.id`, [courseId]
        );
        if (!rows || rows.length === 0) {
            throw new Error('No course performance data found');
        }
        await connection.end();
        res.json({ performance: rows });
    } catch (err) {
        console.error('Error fetching course performance:', err);
        res.status(500).json({ message: 'Error fetching course performance', error: err.message });
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
// College engagement analytics
const getCollegeEngagement = async (req, res) => {
    const { collegeId } = req.query;
    if (!collegeId) return res.status(400).json({ message: 'collegeId required' });
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            `SELECT u.id AS student_id, u.name, COUNT(r.id) AS exams_attempted, AVG(r.score) AS avg_score
             FROM users u
             LEFT JOIN results r ON r.user_id = u.id
             WHERE u.college_id = ? AND u.role = 'student'
             GROUP BY u.id`, [collegeId]
        );
        if (!rows) {
            throw new Error('No engagement data found');
        }
        await connection.end();
        res.json({ engagement: rows });
    } catch (err) {
        console.error('Error fetching engagement:', err);
        res.status(500).json({ message: 'Error fetching engagement', error: err.message });
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
// Batch-wise SWOT/performance comparison
const getBatchSwotComparison = async (req, res) => {
    const { batchIds } = req.body;
    if (!Array.isArray(batchIds) || batchIds.length === 0) {
        return res.status(400).json({ message: 'batchIds required' });
    }
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const placeholders = batchIds.map(() => '?').join(',');
        const [rows] = await connection.execute(
            `SELECT b.id AS batch_id, b.name, AVG(r.score) AS avg_score, COUNT(r.id) AS attempts
             FROM batches b
             JOIN batch_students bs ON bs.batchId = b.id
             JOIN results r ON r.user_id = bs.studentId
             WHERE b.id IN (${placeholders})
             GROUP BY b.id`, batchIds
        );
        if (!rows || rows.length === 0) {
            throw new Error('No data found for the provided batch IDs');
        }
        res.json({ comparison: rows });
    } catch (err) {
        console.error('Error fetching batch SWOT comparison:', err);
        res.status(500).json({ message: 'Error fetching batch SWOT comparison', error: err.message });
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

// Log an action (for use in other endpoints or direct call)
const logAudit = async (req, res) => {
    const { userId, action, resourceType, resourceId, details } = req.body;
    const ipAddress = req.ip || (req.connection && req.connection.remoteAddress);
    
    if (!userId || !action) {
        return res.status(400).json({ message: 'userId and action required' });
    }
    
    try {
        if (!AuditLog || !AuditLog.log) {
            throw new Error('AuditLog service is unavailable');
        }

        await AuditLog.log({ userId, action, resourceType, resourceId, details, ipAddress });
        res.json({ message: 'Audit log recorded' });
    } catch (err) {
        console.error('Error logging audit:', err);
        res.status(500).json({ message: 'Error logging audit', error: err.message });
    }
};
// List audit logs
const listAuditLogs = async (req, res) => {
    const { userId, action, resourceType, resourceId, limit } = req.query;
    let logs;
    try {
        if (!AuditLog || !AuditLog.list) {
            throw new Error('AuditLog service is unavailable');
        }
        logs = await AuditLog.list({ userId, action, resourceType, resourceId, limit: limit ? parseInt(limit, 10) : 100 });
        if (!logs) {
            throw new Error('No audit logs found');
        }
    } catch (err) {
        console.error('Error listing audit logs:', err);
        return res.status(500).json({ message: 'Error listing audit logs', error: err.message });
    }
    res.json({ logs });
};

// Usage analytics: count of colleges, users, exams, attempts
const getUsageAnalytics = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [[{ colleges }]] = await connection.execute('SELECT COUNT(*) AS colleges FROM colleges');
        const [[{ users }]] = await connection.execute('SELECT COUNT(*) AS users FROM users');
        const [[{ exams }]] = await connection.execute('SELECT COUNT(*) AS exams FROM exams');
        const [[{ attempts }]] = await connection.execute('SELECT COUNT(*) AS attempts FROM results');
        if (!colleges || !users || !exams || !attempts) {
            throw new Error('Some usage analytics fields are undefined');
        }
        await connection.end();
        res.json({ colleges, users, exams, attempts });
    } catch (err) {
        console.error('Error fetching usage analytics:', err);
        res.status(500).json({ message: 'Error fetching usage analytics', error: err.message });
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

// Save AI settings
const saveAISettings = async (req, res) => {
    const { config } = req.body;
    if (!config || typeof config !== 'object') return res.status(400).json({ message: 'config required' });
    try {
        if (aiConfig === null) {
            throw new Error('aiConfig is null');
        }
        aiConfig = { ...aiConfig, ...config };
        res.json({ message: 'AI settings saved', aiConfig });
    } catch (err) {
        console.error('Error saving AI settings:', err);
        res.status(500).json({ message: 'Error saving AI settings', error: err.message });
    }
};

// Get AI settings
const getAISettings = async (req, res) => {
    if (aiConfig === null) {
        throw new Error('aiConfig is null');
    }
    res.json({ aiConfig });
};

// List FAQs
const listFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.list();
        if (faqs === null) {
            throw new Error('FAQs is null');
        }
        res.json({ faqs });
    } catch (err) {
        console.error('Error listing FAQs:', err);
        res.status(500).json({ message: 'Error listing FAQs', error: err.message });
    }
};
// Add FAQ
const addFAQ = async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ message: 'question and answer required' });
    }
    try {
        if (FAQ === null) {
            throw new Error('FAQ is null');
        }
        await FAQ.add({ question, answer });
        res.json({ message: 'FAQ added' });
    } catch (err) {
        console.error('Error adding FAQ:', err);
        res.status(500).json({ message: 'Error adding FAQ', error: err.message });
    }
};
// Update FAQ
const updateFAQ = async (req, res) => {
    const { id, question, answer } = req.body;
    if (!id || !question || !answer) {
        return res.status(400).json({ message: 'id, question, answer required' });
    }
    if (id === null || typeof id !== 'string' || id.trim() === '') {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (question === null || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ message: 'Invalid question' });
    }
    if (answer === null || typeof answer !== 'string' || answer.trim() === '') {
        return res.status(400).json({ message: 'Invalid answer' });
    }
    try {
        if (FAQ === null) {
            throw new Error('FAQ is null');
        }
        await FAQ.update({ id, question, answer });
        res.json({ message: 'FAQ updated' });
    } catch (err) {
        console.error('Error updating FAQ:', err);
        res.status(500).json({ message: 'Error updating FAQ', error: err.message });
    }
};
// Remove FAQ
const removeFAQ = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'id required' });
    try {
        if (FAQ === null) {
            throw new Error('FAQ is null');
        }
        await FAQ.remove(id);
        res.json({ message: 'FAQ removed' });
    } catch (err) {
        console.error('Error removing FAQ:', err);
        res.status(500).json({ message: 'Error removing FAQ', error: err.message });
    }
};

// Faculty Activity Reports (admin analytics)
const getFacultyActivityReport = async (req, res) => {
    const { collegeId, startDate, endDate } = req.query;
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        // Logins
        const [logins] = await connection.execute(
            `SELECT u.id AS facultyId, u.name, COUNT(a.id) AS loginCount
             FROM users u
             LEFT JOIN audit_logs a ON a.user_id = u.id AND a.action = 'login' AND a.created_at BETWEEN ? AND ?
             WHERE u.role = 'faculty' AND u.college_id = ?
             GROUP BY u.id`, [startDate, endDate, collegeId]
        );
        // Content uploads
        const [uploads] = await connection.execute(
            `SELECT u.id AS facultyId, COUNT(f.id) AS contentUploads
             FROM users u
             LEFT JOIN files f ON f.uploader_id = u.id AND f.uploader_role = 'faculty' AND f.created_at BETWEEN ? AND ?
             WHERE u.role = 'faculty' AND u.college_id = ?
             GROUP BY u.id`, [startDate, endDate, collegeId]
        );
        // Exams created
        const [exams] = await connection.execute(
            `SELECT u.id AS facultyId, COUNT(e.id) AS examsCreated
             FROM users u
             LEFT JOIN exams e ON e.created_by = u.id AND e.created_at BETWEEN ? AND ?
             WHERE u.role = 'faculty' AND u.college_id = ?
             GROUP BY u.id`, [startDate, endDate, collegeId]
        );
        await connection.end();
        // Merge results by facultyId
        const report = logins.map(l => {
            const upload = uploads.find(u => u.facultyId === l.facultyId) || {};
            const exam = exams.find(e => e.facultyId === l.facultyId) || {};
            return {
                facultyId: l.facultyId,
                name: l.name,
                loginCount: l.loginCount,
                contentUploads: upload.contentUploads || 0,
                examsCreated: exam.examsCreated || 0
            };
        });
        res.json({ report });
    } catch (err) {
        console.error('Error fetching faculty activity report:', err);
        res.status(500).json({ message: 'Error fetching faculty activity report', error: err.message });
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

// Set integration setting (API key)
const setIntegrationSetting = async (req, res) => {
    const { collegeId, provider, apiKey, apiSecret } = req.body;
    if (!collegeId || !provider || !apiKey) {
        return res.status(400).json({ message: 'collegeId, provider, apiKey required' });
    }
    try {
        await IntegrationSetting.set({ collegeId, provider, apiKey, apiSecret });
        res.json({ message: 'Integration setting saved' });
    } catch (err) {
        console.error('Error saving integration setting:', err);
        res.status(500).json({ message: 'Error saving integration setting', error: err.message });
    }
};
// Get integration setting
const getIntegrationSetting = async (req, res) => {
    const { collegeId, provider } = req.query;
    if (!collegeId || !provider) {
        return res.status(400).json({ message: 'collegeId and provider required' });
    }
    try {
        const setting = await IntegrationSetting.get({ collegeId, provider });
        if (setting === null) {
            return res.status(404).json({ message: 'Integration setting not found' });
        }
        res.json({ setting });
    } catch (err) {
        console.error('Error fetching integration setting:', err);
        res.status(500).json({ message: 'Error fetching integration setting', error: err.message });
    }
};
// List all integration settings for a college
const listIntegrationSettings = async (req, res) => {
    const { collegeId } = req.query;
    if (!collegeId) return res.status(400).json({ message: 'collegeId required' });
    try {
        const settings = await IntegrationSetting.list({ collegeId });
        if (settings === null) {
            return res.status(404).json({ message: 'Integration settings not found' });
        }
        res.json({ settings });
    } catch (err) {
        console.error('Error listing integration settings:', err);
        res.status(500).json({ message: 'Error listing integration settings', error: err.message });
    }
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
    assignExamToStudentOrBatch,
    createBatch,
    listBatches,
    deleteBatch,
    assignStudentsToBatch,
    assignExamsToBatch,
    listBatchStudents,
    listBatchExams,
    createCourse,
    updateCourse,
    deleteCourse,
    listCourses,
    assignCourseToBatch,
    setFeatureToggle,
    getFeatureToggle,
    listFeatureToggles,
    requestFacultyApproval,
    reviewFacultyApproval,
    listFacultyApprovals,
    requestExamApproval,
    reviewExamApproval,
    listExamApprovals,
    requestContentApproval,
    reviewContentApproval,
    listContentApprovals,
    grantPermission,
    revokePermission,
    checkPermission,
    listPermissions,
    exportStudentsExcel,
    exportResultsExcel,
    exportBatchAnalyticsExcel,
    getBatchPerformance,
    getCoursePerformance,
    getCollegeEngagement,
    getBatchSwotComparison,
    logAudit,
    listAuditLogs,
    getUsageAnalytics,
    saveAISettings,
    getAISettings,
    listFAQs,
    addFAQ,
    updateFAQ,
    removeFAQ,
    getFacultyActivityReport,
    setIntegrationSetting,
    getIntegrationSetting,
    listIntegrationSettings
};