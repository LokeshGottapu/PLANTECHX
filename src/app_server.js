const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth.js');
const { register, login } = require('../controllers/authController.js');
const collegeController = require('../controllers/collegeController.js');
const examController = require('../controllers/examController.js');
const { getFacultyPerformance, getLSRWAnalytics, getBatchComparison, generatePDFReport, generateExcelReport } = require('../controllers/facultyController.js');
const { handleUserUpload, handleQuestionBankUpload, handleReportUpload, deleteFile } = require('../controllers/fileController.js');
const upload = require('../middleware/multerConfig.js');
const rateLimit = require('express-rate-limit');
const { validateUserPerformanceRequest, validateAIQuestionsRequest } = require('../middleware/validation');
require('dotenv').config();

const cors = require("cors");

const app = express();

// Security middleware
const helmet = require('helmet');
app.use(helmet());

// Body parser configuration with size limits
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// CORS configuration based on environment
app.use(
    cors({
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
);

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// More strict rate limit for authentication routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: {
        error: 'Too many login attempts, please try again later.'
    }
});

// Helper function to trim user input
const trimUserData = (userData) => {
    Object.keys(userData).forEach(key => {
        if (typeof userData[key] === "string") {
            userData[key] = userData[key].trim();
        }
    });
    return userData;
};

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes with rate limiting
app.post('/auth/register', authLimiter, register);
app.post('/auth/login', authLimiter, login);

// College Management Routes
app.post('/colleges', authenticateToken, authorizeRole('admin'), collegeController.createCollege);
app.get('/colleges', authenticateToken, collegeController.getColleges);
app.put('/colleges/:collegeId/approve', authenticateToken, authorizeRole('admin'), collegeController.approveCollege);
app.post('/colleges/admin', authenticateToken, authorizeRole('admin'), collegeController.assignCollegeAdmin);
app.post('/colleges/exam', authenticateToken, authorizeRole('admin'), collegeController.assignExamToCollege);
app.post('/colleges/lsrw-access', authenticateToken, authorizeRole('admin'), collegeController.grantLSRWAccess);
app.get('/colleges/:collegeId/performance', authenticateToken, collegeController.getCollegePerformance);

// Exam Management Routes
app.post('/exams', authenticateToken, authorizeRole('faculty'), examController.createExam);
app.post('/exams/:examId/questions', authenticateToken, authorizeRole('faculty'), examController.addQuestion);
app.post('/exams/:examId/submit', authenticateToken, examController.submitExam);
app.get('/exams/performance/:userId', authenticateToken, validateUserPerformanceRequest, examController.getUserPerformance);
app.get('/exams/ai-questions', authenticateToken, authorizeRole('faculty'), validateAIQuestionsRequest, examController.generateAIQuestions);

// Faculty Analytics and Reports
app.get('/faculty/:facultyId/performance', authenticateToken, authorizeRole('admin'), getFacultyPerformance);
app.get('/faculty/lsrw/:examId', authenticateToken, authorizeRole('faculty'), getLSRWAnalytics);
app.get('/faculty/batch-comparison', authenticateToken, authorizeRole('faculty'), getBatchComparison);
app.get('/faculty/:facultyId/report/pdf', authenticateToken, authorizeRole('admin'), generatePDFReport);
app.get('/faculty/:facultyId/report/excel', authenticateToken, authorizeRole('admin'), generateExcelReport);

// File upload routes
app.post('/upload/user', authenticateToken, upload.array('files'), handleUserUpload);
app.post('/upload/question-bank', authenticateToken, authorizeRole('faculty'), upload.array('files'), handleQuestionBankUpload);
app.post('/upload/report', authenticateToken, authorizeRole('admin'), upload.array('files'), handleReportUpload);
app.delete('/files', authenticateToken, authorizeRole('admin'), deleteFile);

// Start server
const startServer = async (port) => {
    try {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

// Start server with port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;
startServer(PORT);
