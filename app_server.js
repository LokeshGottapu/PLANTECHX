<<<<<<< HEAD
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
=======
const api_model = require("./model.js");
// const { authenticateToken, authorizeRole } = require('../middleware/auth.js');
// const { register, login } = require('../controllers/authController.js');
// const { handleUserUpload, handleQuestionBankUpload, handleReportUpload, deleteFile } = require('../controllers/fileController.js');
// const { getFacultyPerformance, getLSRWAnalytics, getBatchComparison, generatePDFReport, generateExcelReport } = require('../controllers/facultyController.js');
// const upload = require('../middleware/multerConfig.js');
// const { sequelize } = require('../models/index.js');
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { toLower, lowerFirst, isEmpty, last } = require("lodash");

const app = express();

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);
app.use(express.json());

app.use(
    cors({
        origin: "*"
    })
);

// // Helper function to trim user input
// const trimUserData = (userData) => {
//     Object.keys(userData).forEach(key => {
//         if (typeof userData[key] === "string") {
//             userData[key] = userData[key].trim();
//         }
//     });
//     return userData;
// };

// // Auth routes
// app.post('/auth/register', register);
// app.post('/auth/login', login);

// // College Management Routes
// app.post('/colleges', authenticateToken, authorizeRole('admin'), collegeController.createCollege);
// app.get('/colleges', authenticateToken, collegeController.getColleges);
// app.put('/colleges/:collegeId/approve', authenticateToken, authorizeRole('admin'), collegeController.approveCollege);
// app.post('/colleges/admin', authenticateToken, authorizeRole('admin'), collegeController.assignCollegeAdmin);
// app.post('/colleges/exam', authenticateToken, authorizeRole('admin'), collegeController.assignExamToCollege);
// app.post('/colleges/lsrw-access', authenticateToken, authorizeRole('admin'), collegeController.grantLSRWAccess);
// app.get('/colleges/:collegeId/performance', authenticateToken, collegeController.getCollegePerformance);

// // Exam Management Routes
// app.post('/exams', authenticateToken, authorizeRole('faculty'), examController.createExam);
// app.post('/exams/:examId/questions', authenticateToken, authorizeRole('faculty'), examController.addQuestion);
// app.post('/exams/:examId/submit', authenticateToken, examController.submitExam);

// // Faculty Analytics and Reports
// app.get('/faculty/:facultyId/performance', authenticateToken, authorizeRole('admin'), getFacultyPerformance);
// app.get('/faculty/lsrw/:examId', authenticateToken, authorizeRole('faculty'), getLSRWAnalytics);
// app.get('/faculty/batch-comparison', authenticateToken, authorizeRole('faculty'), getBatchComparison);
// app.get('/faculty/:facultyId/report/pdf', authenticateToken, authorizeRole('admin'), generatePDFReport);
// app.get('/faculty/:facultyId/report/excel', authenticateToken, authorizeRole('admin'), generateExcelReport);

// // File upload routes
// app.post('/upload/user', authenticateToken, upload.array('files'), handleUserUpload);
// app.post('/upload/question-bank', authenticateToken, authorizeRole('faculty'), upload.array('files'), handleQuestionBankUpload);
// app.post('/upload/report', authenticateToken, authorizeRole('admin'), upload.array('files'), handleReportUpload);
// app.delete('/files', authenticateToken, authorizeRole('admin'), deleteFile);

// // Sync database
// sequelize.sync({ alter: true })
//     .then(() => {
//         console.log('Database synchronized successfully');
//     })
//     .catch((error) => {
//         console.error('Error synchronizing database:', error);
//     });


// // Users routes
// app.get("/users", authenticateToken, authorizeRole('admin'), async (req, res) => {
//     let { page, limit } = req.query;
//     page = parseInt(page) || 1;  // Default page = 1
//     limit = parseInt(limit) || 5; // Default limit = 5
//     const offset = (page - 1) * limit;

//     try {
//         const users = await api_model.getUsers(offset, limit);
//         const totalUsers = await api_model.getTotalUsers();

//         res.status(200).json({
//             totalUsers,
//             totalPages: Math.ceil(totalUsers / limit),
//             currentPage: page,
//             pageSize: limit,
//             users: users
//         });
//     }
//     catch (err) {
//         console.error(`Error fetching users:`, err);
//         res.status(500).json({ message: `Failed to fetch users: ${err.message}` });
//     }
// });

// app.post("/user", async (req, res) => {
//     let userData = trimUserData(req.body);
//     try {
//         var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));
//         var values = fields.map(field => field.value);

//         const user = await api_model.postUser(fields, values);
//         console.log("user:", user);

//         if (user.affectedRows !== 0) {
//             let insertId = user.insertId;
//             res.status(201).json({
//                 message: `A new user was added`,
//                 userId: insertId
//             });
//         }

//     } catch (err) {
//         console.error(`Failed to add user:`, err);
//         res.status(500).json({ message: "An error occurred while adding a new user" });
//     }
// });

// app.get("/users/:userId", authenticateToken, async (req, res) => {
//     let userId = Number(req.params.userId);

//     if (!Number.isInteger(userId)) {
//         return res.status(400).json({ message: "Invalid user ID" });
//     }

//     try {
//         const user = await api_model.getUser(userId);
//         console.log("User Data:", user);

//         if (user.length === 0) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         res.status(200).json(user);

//     } catch (err) {
//         console.error("Database query error:", err);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// app.put("/users/:userId", authenticateToken, authorizeRole('admin'), async (req, res) => {
//     let userId = Number(req.params.userId);

//     if (!Number.isInteger(userId)) {
//         return res.status(400).json({ message: "Invalid user ID" });
//     }

//     try {
//         let userData = trimUserData(req.body);
//         var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));
//         var values = fields.map(field => field.value);

//         const putUser = await api_model.putUser(userId, fields, values);

//         if (putUser.affectedRows !== 0) {
//             console.log(`User with ID: ${userId} updated successfully`);
//             return res.status(200).json({ message: `User with ID: ${userId} updated successfully` });
//         } else {
//             return res.status(404).json({ message: "User not found" });
//         }

//     } catch (err) {
//         console.error(`Error updating user with ID ${userId}:`, err);
//         return res.status(500).json({ message: "An error occurred while updating the user." });
//     }
// });

// app.delete("/users/:userId", authenticateToken, authorizeRole('admin'), async (req, res) => {
//     let userId = Number(req.params.userId);

//     if (!Number.isInteger(userId)) {
//         return res.status(400).json({ message: "Invalid user ID" });
//     }

//     try {
//         const deleteUser = await api_model.deleteUser(userId);

//         if (deleteUser.affectedRows !== 0) {
//             res.status(200).json({ message: `User with ID: ${userId} deleted successfully` });
//         }
//         else {
//             res.status(404).json({ message: "User not found" });
//         }

//     } catch (err) {
//         console.error(`Error deleting user with ID ${userId}:`, err);
//         res.status(500).json({ message: "An error occurred while deleting the user" });
//     }
// });


app.get("/examToUser/:userId", async function (req, res) {

    try {

        const { examName } = req.query;
        const { userId } = req.params;
        const getExamName = await api_model.getExamName(examName, userId);

        res.status(200).json({
            examName: getExamName
        });
    }
    catch (err) {
        console.error(`Error in fetching users:`, err);
        res.status(500).json({ message: `An error occured while fetching the exams.` });
    }

});

app.post("/examToUser", async function (req, res) {

    var userData = req.body;

    if (!userData || Object.keys(userData).length === 0) {
        return res.status(400).json({ message: "Request body is empty or invalid." });
    }

    try {

        var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));
        var values = fields.map(field => field.value);

        var postExamToUser = await api_model.postExamToUser(fields, values);

        res.json({
            message: `A new exam was asigned to the user.`
        });

    } catch (err) {
        console.error("Error assigning exam to user:", err.message, err.stack);
        res.status(500).json({ message: "An error occurred while assigning an exam to the user." });
    }

});

app.get("/examsToUser/:userId", async function (req, res) {

    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {

        const getUserDetails = await api_model.getUserDetails(userId);

        if (getUserDetails.length === 0) {
            return res.status(404).json({ message: "User was not found." });
        }

        const examsToUser = await api_model.getExamsToUser(userId);
        getUserDetails[0].exams = examsToUser;

        console.log(getUserDetails);
        res.status(200).json({ getUserDetails });

    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }

});





const PORT = process.env.PORT || 5000;

const startServer = async (port) => {
    try {
        await new Promise((resolve, reject) => {
            const server = app.listen(port)
                .once('listening', () => {
                    console.log(`Server is running on port ${port}`);
                    resolve();
                })
                .once('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`Port ${port} is busy, trying port ${port + 1}`);
                        server.close();
                        startServer(port + 1);
                    } else {
                        console.error('Server error:', err);
                        reject(err);
                    }
                });
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer(PORT);
>>>>>>> 08321dbd3cbb96d56ad7dc9de201d4b5bcce95dd
