const { query } = require('../model');

module.exports = {
    // College Management
    createCollege: async (collegeData) => {
        try {
            const sql = 'INSERT INTO colleges (name, address, status, created_at) VALUES (?, ?, ?, NOW())';
            const result = await query(sql, [collegeData.name, collegeData.address, 'pending']);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to create college');
        }
    },

    approveCollege: async (collegeId) => {
        try {
            const sql = 'UPDATE colleges SET status = ? WHERE college_id = ?';
            const result = await query(sql, ['approved', collegeId]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to approve college');
        }
    },

    getColleges: async (filters = {}) => {
        try {
            let sql = 'SELECT * FROM colleges';
            const values = [];
            
            if (filters.status) {
                sql += ' WHERE status = ?';
                values.push(filters.status);
            }
            
            const result = await query(sql, values);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch colleges');
        }
    },

    // CEO and Team Management
    assignCollegeAdmin: async (userId, collegeId, role) => {
        try {
            const sql = 'INSERT INTO college_admins (user_id, college_id, role) VALUES (?, ?, ?)';
            const result = await query(sql, [userId, collegeId, role]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to assign college admin');
        }
    },

    // Exam Management
    assignExamToCollege: async (examId, collegeId, startDate, endDate) => {
        try {
            const sql = 'INSERT INTO college_exams (exam_id, college_id, start_date, end_date) VALUES (?, ?, ?, ?)';
            const result = await query(sql, [examId, collegeId, startDate, endDate]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to assign exam to college');
        }
    },

    // LSRW Access Management
    grantLSRWAccess: async (collegeId, accessLevel) => {
        try {
            const sql = 'INSERT INTO lsrw_access (college_id, access_level, granted_at) VALUES (?, ?, NOW())';
            const result = await query(sql, [collegeId, accessLevel]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to grant LSRW access');
        }
    },

    // Analytics and Reports
    getCollegePerformance: async (collegeId, filters = {}) => {
        try {
            let sql = `
                SELECT 
                    e.exam_name,
                    COUNT(DISTINCT ur.user_id) as total_participants,
                    AVG(ur.score) as average_score,
                    MIN(ur.score) as lowest_score,
                    MAX(ur.score) as highest_score
                FROM college_exams ce
                JOIN exams e ON ce.exam_id = e.exam_id
                JOIN user_results ur ON e.exam_id = ur.exam_id
                WHERE ce.college_id = ?
            `;
            const values = [collegeId];

            if (filters.startDate && filters.endDate) {
                sql += ' AND ur.completion_date BETWEEN ? AND ?';
                values.push(filters.startDate, filters.endDate);
            }

            sql += ' GROUP BY e.exam_id';
            
            const result = await query(sql, values);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch college performance');
        }
    }
};