const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Reports
router.get('/dashboard', reportController.getDashboardReport);
router.get('/college-performance', reportController.getCollegePerformance);
router.get('/student-performance', reportController.getStudentPerformance);
router.get('/test-analytics', reportController.getTestAnalytics);
router.get('/usage-statistics', reportController.getUsageStatistics);
router.post('/export', authorizeRole('admin', 'master_admin'), reportController.exportReport);

// Analytics
router.get('/analytics/trends', analyticsController.getTrends);
router.get('/analytics/real-time', analyticsController.getRealTime);

module.exports = router;