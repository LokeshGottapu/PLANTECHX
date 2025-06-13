const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticateToken, authorizeRole } = require('./middleware/auth');
const { handleUserUpload, handleQuestionBankUpload, handleReportUpload, deleteFile } = require('./controllers/fileController');
const examController = require('./controllers/examController');
const collegeController = require('./controllers/collegeController');
const { register, login } = require('./controllers/authController');
const upload = require('./middleware/multerConfig');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Body parser configuration with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting configuration
const apiLimiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
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

// Exam Management Routes
app.post('/exams', authenticateToken, authorizeRole('faculty'), examController.createExam);
app.post('/exams/:examId/questions', authenticateToken, authorizeRole('faculty'), examController.addQuestion);
app.post('/exams/:examId/submit', authenticateToken, examController.submitExam);
app.get('/exams/performance/:userId', authenticateToken, examController.getUserPerformance);
app.get('/exams/ai-questions', authenticateToken, authorizeRole('faculty'), examController.generateAIQuestions);

// File upload routes
app.post('/upload/user', authenticateToken, upload.array('files'), handleUserUpload);
app.post('/upload/question-bank', authenticateToken, authorizeRole('faculty'), upload.array('files'), handleQuestionBankUpload);
app.post('/upload/report', authenticateToken, authorizeRole('admin'), upload.array('files'), handleReportUpload);
app.delete('/files', authenticateToken, authorizeRole('admin'), deleteFile);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
}); 