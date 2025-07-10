const masterRouter = require('express').Router();
const masterController = require('../controllers/masterController');

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

module.exports = masterRouter;