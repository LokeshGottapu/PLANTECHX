const masterRouter = require('express').Router();
const masterController = require('../controllers/masterController');

// User Management
masterRouter.post('/users/invite', masterController.inviteUser);
masterRouter.get('/users', masterController.getAllUsers);
masterRouter.post('/users', masterController.createUser);
masterRouter.put('/users/:id', masterController.updateUser);
masterRouter.delete('/users/:id', masterController.deleteUser);
masterRouter.get('/users/:id/permissions', masterController.getUserPermissions);
masterRouter.put('/users/:id/permissions', masterController.updateUserPermissions);

// College Management
masterRouter.get('/overview', masterController.getPlatformOverview);
masterRouter.post('/colleges', masterController.createCollege);
masterRouter.put('/approve-college/:collegeId', masterController.approveCollege);
masterRouter.put('/assign-admin', masterController.assignAdminToCollege);
masterRouter.get('/colleges', masterController.getAllColleges);
masterRouter.get('/college/:collegeId', masterController.getCollegeDetails);
masterRouter.put('/grant-feature', masterController.grantFeatureAccess);
masterRouter.delete('/college/:collegeId', masterController.removeCollege);
masterRouter.get('/usage/:collegeId', masterController.viewCollegeUsageStats);
masterRouter.get('/revenue', masterController.viewRevenueStats);
masterRouter.get('/report/:collegeId', masterController.generateCollegeReport);
masterRouter.post('/ban', masterController.banCollegeOrUser);
masterRouter.post('/broadcast', masterController.broadcastMessageToAllAdmins);
masterRouter.put('/license', masterController.manageLicenseLimits);
masterRouter.put('/college/:collegeId/block', masterController.blockCollege);
masterRouter.put('/user/:userId/block', masterController.blockUser);
masterRouter.get('/college/:collegeId/isolation', masterController.getMultiTenancyIsolation);
masterRouter.put('/college/:collegeId/isolation', masterController.setMultiTenancyIsolation);

// Auth Management
masterRouter.post('/auth/logout', masterController.logout);
masterRouter.post('/auth/refresh-token', masterController.refreshToken);
masterRouter.get('/auth/profile', masterController.getProfile);
masterRouter.put('/auth/profile', masterController.updateProfile);

// Batch Management
masterRouter.get('/batches', masterController.getBatches);
masterRouter.post('/batches', masterController.createBatch);
masterRouter.put('/batches/:id', masterController.updateBatch);
masterRouter.delete('/batches/:id', masterController.deleteBatch);
masterRouter.get('/batches/:id/streams', masterController.getBatchStreams);
masterRouter.get('/batches/:id/students', masterController.getBatchStudents);
masterRouter.get('/batches/:id/sections', masterController.getBatchSections);

// Stream Management
masterRouter.get('/streams', masterController.getStreams);
masterRouter.post('/streams', masterController.createStream);
masterRouter.put('/streams/:id', masterController.updateStream);
masterRouter.delete('/streams/:id', masterController.deleteStream);
masterRouter.get('/streams/:id/years', masterController.getStreamYears);
masterRouter.get('/streams/:id/sections', masterController.getStreamSections);

// Student Management
masterRouter.get('/students', masterController.getStudents);
masterRouter.post('/students', masterController.createStudent);
masterRouter.put('/students/:id', masterController.updateStudent);
masterRouter.delete('/students/:id', masterController.deleteStudent);
masterRouter.post('/students/bulk-import', masterController.bulkImportStudents);
masterRouter.get('/students/filter', masterController.filterStudents);

// Exam Management
masterRouter.get('/exams', masterController.getExams);
masterRouter.post('/exams', masterController.createExam);
masterRouter.put('/exams/:id', masterController.updateExam);
masterRouter.delete('/exams/:id', masterController.deleteExam);
masterRouter.get('/exams/categories', masterController.getExamCategories);
masterRouter.get('/exams/practice', masterController.getPracticeExams);
masterRouter.get('/exams/assessment', masterController.getAssessmentExams);
masterRouter.get('/exams/mock', masterController.getMockExams);
masterRouter.get('/exams/company-specific', masterController.getCompanySpecificExams);
masterRouter.post('/exams/:id/assign', masterController.assignExam);
masterRouter.get('/exams/:id/reports', masterController.getExamReports);
masterRouter.post('/exams/:id/duplicate', masterController.duplicateExam);

// Test Management
masterRouter.get('/tests', masterController.getTests);
masterRouter.post('/tests', masterController.createTest);
masterRouter.put('/tests/:id', masterController.updateTest);
masterRouter.delete('/tests/:id', masterController.deleteTest);
masterRouter.get('/tests/:id/questions', masterController.getTestQuestions);
masterRouter.post('/tests/:id/questions', masterController.addTestQuestions);
masterRouter.put('/questions/:id', masterController.updateQuestion);
masterRouter.delete('/questions/:id', masterController.deleteQuestion);
masterRouter.post('/tests/bulk-upload', masterController.bulkUploadTests);
masterRouter.get('/tests/filter', masterController.filterTests);

// File Management
masterRouter.get('/files', masterController.getFiles);
masterRouter.post('/files/upload', masterController.uploadFile);
masterRouter.delete('/files/:id', masterController.deleteFile);
masterRouter.get('/files/download/:id', masterController.downloadFile);
masterRouter.get('/folders', masterController.getFolders);
masterRouter.post('/folders', masterController.createFolder);
masterRouter.put('/folders/:id', masterController.updateFolder);
masterRouter.delete('/folders/:id', masterController.deleteFolder);
masterRouter.get('/folders/:id/contents', masterController.getFolderContents);
masterRouter.post('/files/bulk-upload', masterController.bulkUploadFiles);

// AI Request Management
masterRouter.get('/ai-requests', masterController.getAIRequests);
masterRouter.post('/ai-requests', masterController.createAIRequest);
masterRouter.put('/ai-requests/:id', masterController.updateAIRequest);
masterRouter.delete('/ai-requests/:id', masterController.deleteAIRequest);
masterRouter.post('/ai-requests/:id/approve', masterController.approveAIRequest);
masterRouter.post('/ai-requests/:id/reject', masterController.rejectAIRequest);
masterRouter.get('/ai-requests/:id/generate', masterController.generateAIRequest);
masterRouter.post('/ai-requests/:id/upload-syllabus', masterController.uploadSyllabus);

// Report Management
masterRouter.get('/reports/dashboard', masterController.getDashboardReport);
masterRouter.get('/reports/college-performance', masterController.getCollegePerformance);
masterRouter.get('/reports/student-performance', masterController.getStudentPerformance);
masterRouter.get('/reports/test-analytics', masterController.getTestAnalytics);
masterRouter.get('/reports/usage-statistics', masterController.getUsageStatistics);
masterRouter.post('/reports/export', masterController.exportReport);
masterRouter.get('/analytics/trends', masterController.getAnalyticsTrends);
masterRouter.get('/analytics/real-time', masterController.getAnalyticsRealTime);

// Notification Management
masterRouter.get('/notifications', masterController.getNotifications);
masterRouter.post('/notifications', masterController.createNotification);
masterRouter.put('/notifications/:id', masterController.updateNotification);
masterRouter.delete('/notifications/:id', masterController.deleteNotification);
masterRouter.post('/notifications/send', masterController.sendNotification);
masterRouter.get('/notifications/templates', masterController.getNotificationTemplates);
masterRouter.post('/notifications/templates', masterController.createNotificationTemplate);

// Audit Log Management
masterRouter.get('/audit-logs', masterController.getAuditLogs);
masterRouter.get('/audit-logs/filter', masterController.filterAuditLogs);
masterRouter.post('/audit-logs/export', masterController.exportAuditLogs);
masterRouter.get('/audit-logs/critical', masterController.getCriticalAuditLogs);
masterRouter.post('/audit-logs/disable-ip', masterController.disableIP);
masterRouter.get('/system-logs', masterController.getSystemLogs);

// Settings Management
masterRouter.get('/settings', masterController.getSettings);
masterRouter.put('/settings', masterController.updateSettings);
masterRouter.get('/settings/permissions', masterController.getSettingsPermissions);
masterRouter.put('/settings/permissions', masterController.updateSettingsPermissions);
masterRouter.get('/settings/backup', masterController.getBackupSettings);
masterRouter.post('/settings/backup/create', masterController.createBackup);
masterRouter.post('/settings/backup/restore', masterController.restoreBackup);
masterRouter.get('/settings/branding', masterController.getBrandingSettings);
masterRouter.put('/settings/branding', masterController.updateBrandingSettings);

// Course Management
masterRouter.get('/courses', masterController.getCourses);
masterRouter.post('/courses', masterController.createCourse);
masterRouter.put('/courses/:id', masterController.updateCourse);
masterRouter.delete('/courses/:id', masterController.deleteCourse);
masterRouter.get('/courses/:id/modules', masterController.getCourseModules);
masterRouter.post('/courses/:id/modules', masterController.createCourseModule);
masterRouter.get('/courses/:id/students', masterController.getCourseStudents);
masterRouter.post('/courses/:id/enroll', masterController.enrollCourseStudent);

// Dashboard Management
masterRouter.get('/dashboard/stats', masterController.getDashboardStats);
masterRouter.get('/dashboard/recent-activity', masterController.getDashboardRecentActivity);
masterRouter.get('/dashboard/pending-actions', masterController.getDashboardPendingActions);
masterRouter.get('/dashboard/growth-metrics', masterController.getDashboardGrowthMetrics);
masterRouter.get('/dashboard/platform-usage', masterController.getDashboardPlatformUsage);

// Search Management
masterRouter.get('/search/global', masterController.globalSearch);
masterRouter.get('/search/colleges', masterController.searchColleges);
masterRouter.get('/search/students', masterController.searchStudents);
masterRouter.get('/search/tests', masterController.searchTests);
masterRouter.get('/search/suggestions', masterController.searchSuggestions);

module.exports = masterRouter;