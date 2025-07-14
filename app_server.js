// 📦 Load Environment Variables 
require('dotenv').config(); 

// 🧠 Import Core Modules 
const express = require('express'); 
const cors = require('cors'); 
const helmet = require('helmet'); // Security headers
const morgan = require('morgan'); // HTTP request logger
const rateLimit = require('express-rate-limit'); // Rate limiting

// 🔐 Import Middlewares 
const { verifyToken } = require('./middleware/auth'); 
const { validate } = require('./middleware/validation');
const { checkAdmin } = require('./middleware/checkAdmin');
const { checkMaster } = require('./middleware/checkMaster');

// 🛣️ Import Routes 
const authRoutes = require('./routes/authRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const collegeRoutes = require('./routes/collegeRoutes'); 
const examRoutes = require('./routes/examRoutes'); 
const fileRoutes = require('./routes/fileRoutes');
const resultRoutes = require('./routes/resultRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); 
const facultyRoutes = require('./routes/facultyRoutes'); 
const questionRoutes = require('./routes/questionRoutes'); 
const masterRoutes = require('./routes/masterRoutes'); 
const aiTestRequestRoutes = require('./routes/aiTestRequestRoutes');
const practiceTestRoutes = require('./routes/practiceTestRoutes');
const companyTestRoutes = require('./routes/companyTestRoutes');
const assessmentTestRoutes = require('./routes/assessmentTestRoutes'); // New route for assessment tests

// 🛠️ Initialize App 
const app = express(); 

// 🛡️ Security Configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// 🔒 Stricter limits for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // limit each IP to 5 login requests per hour
});

// 🛡️ Middleware Setup 
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: true
})); 
app.use(helmet()); 
app.use(morgan('dev')); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 
app.use(limiter);

// 🌐 API Routes 
app.use('/api/auth', authLimiter, authRoutes);             // 🔐 Authentication
app.use('/api/users', verifyToken, userRoutes);           // 👥 User Management
app.use('/api/colleges', verifyToken, collegeRoutes);     // 🏫 College Management
app.use('/api/exams', verifyToken, examRoutes);           // 📝 Exam Management
app.use('/api/files', verifyToken, fileRoutes);           // 📁 File Management
app.use('/api/results', verifyToken, resultRoutes);       // 📊 Results
app.use('/api/admin', [verifyToken, checkAdmin], adminRoutes);           // 👨‍💼 Admin
app.use('/api/faculty', [verifyToken, checkAdmin], facultyRoutes);       // 👩‍🏫 Faculty
app.use('/api/questions', verifyToken, questionRoutes);   // ❓ Questions
app.use('/api/master', [verifyToken, checkMaster], masterRoutes);        // 🎓 Master Admin
app.use('/api/ai-test', aiTestRequestRoutes); // AI Test Request APIs
app.use('/api/practice-tests', verifyToken, practiceTestRoutes); // Practice Test APIs
app.use('/api/company-tests', verifyToken, companyTestRoutes); // Company Test APIs
app.use('/api/assessment-tests', verifyToken, assessmentTestRoutes); // Assessment Test APIs

// ✅ Health Check 
app.get('/health', (req, res) => { 
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    }); 
}); 

// ❌ Error Handling
app.use((req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: 'Resource not found'
    });
});

app.use((err, req, res, next) => { 
    console.error('Error:', err.stack); 
    res.status(err.status || 500).json({ 
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }); 
}); 

// 🚀 Server Startup
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => { 
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`); 
}); 

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Performing graceful shutdown...');
    process.exit(0);
});

module.exports = app; // For testing

// If you want to keep the SQL for reference, use a comment:
/*
CREATE TABLE ai_test_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requested_by INT,
    content TEXT,
    status ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
    generated_test JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
*/
