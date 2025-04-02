const api_model = require("./model.js");
const { authenticateToken, authorizeRole } = require('./middleware/auth');
const { register, login } = require('./controllers/authController');
const { handleUserUpload, handleQuestionBankUpload, handleReportUpload, deleteFile } = require('./controllers/fileController');
const { getFacultyPerformance, getLSRWAnalytics, getBatchComparison, generatePDFReport, generateExcelReport } = require('./controllers/facultyController');
const upload = require('./middleware/multerConfig');
require('dotenv').config();

const express = require("express");
const cors = require("cors");

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

// Helper function to trim user input
const trimUserData = (userData) => {
    Object.keys(userData).forEach(key => {
        if (typeof userData[key] === "string") {
            userData[key] = userData[key].trim();
        }
    });
    return userData;
};

// Auth routes
app.post('/auth/register', register);
app.post('/auth/login', login);

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

// Users routes
app.get("/users", authenticateToken, authorizeRole('admin'), async (req, res) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;  // Default page = 1
    limit = parseInt(limit) || 5; // Default limit = 5
    const offset = (page - 1) * limit;

    try {
        const users = await api_model.getUsers(offset, limit);
        const totalUsers = await api_model.getTotalUsers();

        res.status(200).json({
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            pageSize: limit,
            users: users
        });
    }
    catch (err) {
        console.error(`Error fetching users:`, err);
        res.status(500).json({ message: `Failed to fetch users: ${err.message}` });
    }
});

app.post("/user", async (req, res) => {
    let userData = trimUserData(req.body);
    try {
        var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));
        var values = fields.map(field => field.value);

        const user = await api_model.postUser(fields, values);
        console.log("user:", user);

        if (user.affectedRows !== 0) {
            let insertId = user.insertId;
            res.status(201).json({
                message: `A new user was added`,
                userId: insertId
            });
        }

    } catch (err) {
        console.error(`Failed to add user:`, err);
        res.status(500).json({ message: "An error occurred while adding a new user" });
    }
});

app.get("/users/:userId", authenticateToken, async (req, res) => {
    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        const user = await api_model.getUser(userId);
        console.log("User Data:", user);

        if (user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);

    } catch (err) {
        console.error("Database query error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

app.put("/users/:userId", authenticateToken, authorizeRole('admin'), async (req, res) => {
    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        let userData = trimUserData(req.body);
        var fields = Object.entries(userData).map(([key, value]) => ({ key, value }));
        var values = fields.map(field => field.value);

        const putUser = await api_model.putUser(userId, fields, values);

        if (putUser.affectedRows !== 0) {
            console.log(`User with ID: ${userId} updated successfully`);
            return res.status(200).json({ message: `User with ID: ${userId} updated successfully` });
        } else {
            return res.status(404).json({ message: "User not found" });
        }

    } catch (err) {
        console.error(`Error updating user with ID ${userId}:`, err);
        return res.status(500).json({ message: "An error occurred while updating the user." });
    }
});

app.delete("/users/:userId", authenticateToken, authorizeRole('admin'), async (req, res) => {
    let userId = Number(req.params.userId);

    if (!Number.isInteger(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        const deleteUser = await api_model.deleteUser(userId);

        if (deleteUser.affectedRows !== 0) {
            res.status(200).json({ message: `User with ID: ${userId} deleted successfully` });
        }
        else {
            res.status(404).json({ message: "User not found" });
        }

    } catch (err) {
        console.error(`Error deleting user with ID ${userId}:`, err);
        res.status(500).json({ message: "An error occurred while deleting the user" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
