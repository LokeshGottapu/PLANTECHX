const collegeModel = require('../models/collegeModel');

module.exports = {
    // College Management
    createCollege: async (req, res) => {
        try {
            const { name, address } = req.body;
            const result = await collegeModel.createCollege({ name, address });
            res.status(201).json({
                message: 'College created successfully',
                collegeId: result.insertId
            });
        } catch (error) {
            console.error('Create college error:', error);
            res.status(500).json({ message: 'Error creating college' });
        }
    },

    approveCollege: async (req, res) => {
        try {
            const { collegeId } = req.params;
            await collegeModel.approveCollege(collegeId);
            res.json({ message: 'College approved successfully' });
        } catch (error) {
            console.error('Approve college error:', error);
            res.status(500).json({ message: 'Error approving college' });
        }
    },

    getColleges: async (req, res) => {
        try {
            const { status } = req.query;
            const colleges = await collegeModel.getColleges({ status });
            res.json(colleges);
        } catch (error) {
            console.error('Get colleges error:', error);
            res.status(500).json({ message: 'Error fetching colleges' });
        }
    },

    // CEO and Team Management
    assignCollegeAdmin: async (req, res) => {
        try {
            const { userId, collegeId, role } = req.body;
            await collegeModel.assignCollegeAdmin(userId, collegeId, role);
            res.json({ message: 'College admin assigned successfully' });
        } catch (error) {
            console.error('Assign admin error:', error);
            res.status(500).json({ message: 'Error assigning college admin' });
        }
    },

    // Exam Management
    assignExamToCollege: async (req, res) => {
        try {
            const { examId, collegeId, startDate, endDate } = req.body;
            await collegeModel.assignExamToCollege(examId, collegeId, startDate, endDate);
            res.json({ message: 'Exam assigned to college successfully' });
        } catch (error) {
            console.error('Assign exam error:', error);
            res.status(500).json({ message: 'Error assigning exam to college' });
        }
    },

    // LSRW Access Management
    grantLSRWAccess: async (req, res) => {
        try {
            const { collegeId, accessLevel } = req.body;
            await collegeModel.grantLSRWAccess(collegeId, accessLevel);
            res.json({ message: 'LSRW access granted successfully' });
        } catch (error) {
            console.error('Grant LSRW access error:', error);
            res.status(500).json({ message: 'Error granting LSRW access' });
        }
    },

    // Analytics and Reports
    getCollegePerformance: async (req, res) => {
        try {
            const { collegeId } = req.params;
            const { startDate, endDate } = req.query;
            const performance = await collegeModel.getCollegePerformance(collegeId, { startDate, endDate });
            res.json(performance);
        } catch (error) {
            console.error('Get performance error:', error);
            res.status(500).json({ message: 'Error fetching college performance' });
        }
    }
};