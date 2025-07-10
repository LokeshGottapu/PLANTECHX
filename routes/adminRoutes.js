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

module.exports = router;