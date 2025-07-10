// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard', adminController.getDashboard);
router.post('/students', adminController.createStudent);
router.get('/students', adminController.getAllStudents);
router.post('/materials', adminController.uploadStudyMaterial);
router.post('/notifications', adminController.sendNotification);
router.get('/performance', adminController.getStudentPerformance);
router.get('/manage-students', adminController.manageStudents);
router.get('/manage-exams', adminController.manageExams);
router.post('/assign-exam', adminController.assignExamToStudentOrBatch);
router.post('/feature-toggle', adminController.setFeatureToggle);
router.get('/feature-toggle', adminController.getFeatureToggle);
router.get('/feature-toggles', adminController.listFeatureToggles);
// Faculty approval
router.post('/faculty-approval/request', adminController.requestFacultyApproval);
router.post('/faculty-approval/review', adminController.reviewFacultyApproval);
router.get('/faculty-approval/list', adminController.listFacultyApprovals);
// Exam approval
router.post('/exam-approval/request', adminController.requestExamApproval);
router.post('/exam-approval/review', adminController.reviewExamApproval);
router.get('/exam-approval/list', adminController.listExamApprovals);
// Content approval
router.post('/content-approval/request', adminController.requestContentApproval);
router.post('/content-approval/review', adminController.reviewContentApproval);
router.get('/content-approval/list', adminController.listContentApprovals);
// Excel exports
router.get('/export/students', adminController.exportStudentsExcel);
router.get('/export/results', adminController.exportResultsExcel);
router.get('/export/batch-analytics', adminController.exportBatchAnalyticsExcel);
// Analytics
router.get('/analytics/batch-performance', adminController.getBatchPerformance);
router.get('/analytics/course-performance', adminController.getCoursePerformance);
router.get('/analytics/college-engagement', adminController.getCollegeEngagement);
router.post('/analytics/batch-swot-comparison', adminController.getBatchSwotComparison);
router.get('/analytics/usage', adminController.getUsageAnalytics);
router.get('/analytics/faculty-activity', adminController.getFacultyActivityReport);
// AI settings
router.post('/ai/settings', adminController.saveAISettings);
router.get('/ai/settings', adminController.getAISettings);
// Chatbot FAQ management
router.get('/chatbot/faqs', adminController.listFAQs);
router.post('/chatbot/faqs/add', adminController.addFAQ);
router.put('/chatbot/faqs/update', adminController.updateFAQ);
router.delete('/chatbot/faqs/remove', adminController.removeFAQ);
// Audit logs
router.post('/audit/log', adminController.logAudit);
router.get('/audit/list', adminController.listAuditLogs);
// Integration settings
router.post('/integration/setting', adminController.setIntegrationSetting);
router.get('/integration/setting', adminController.getIntegrationSetting);
router.get('/integration/settings', adminController.listIntegrationSettings);

module.exports = router;