const { query } = require('../model');

module.exports = {
    // Faculty Performance Tracking
    getFacultyContributions: async (facultyId) => {
        try {
            const sql = `
                SELECT 
                    COUNT(DISTINCT e.exam_id) as exams_created,
                    COUNT(DISTINCT q.question_id) as questions_contributed,
                    COUNT(DISTINCT ur.user_id) as students_assessed,
                    e.created_by as faculty_id
                FROM exams e
                LEFT JOIN questions q ON e.exam_id = q.exam_id
                LEFT JOIN user_results ur ON e.exam_id = ur.exam_id
                WHERE e.created_by = ?
                GROUP BY e.created_by
            `;
            const result = await query(sql, [facultyId]);
            return result[0] || { exams_created: 0, questions_contributed: 0, students_assessed: 0, faculty_id: facultyId };
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch faculty contributions');
        }
    },

    // Faculty Analytics
    getFacultyExamStats: async (facultyId) => {
        try {
            const sql = `
                SELECT 
                    e.exam_id,
                    e.exam_name,
                    COUNT(DISTINCT ur.user_id) as total_participants,
                    AVG(ur.score) as average_score,
                    COUNT(CASE WHEN ur.score >= 60 THEN 1 END) as passing_count,
                    MAX(ur.score) as highest_score,
                    MIN(ur.completion_time) as best_completion_time
                FROM exams e
                LEFT JOIN user_results ur ON e.exam_id = ur.exam_id
                WHERE e.created_by = ?
                GROUP BY e.exam_id, e.exam_name
            `;
            return await query(sql, [facultyId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch faculty exam statistics');
        }
    },

    // LSRW Analytics
    getLSRWAnalytics: async (examId) => {
        try {
            const sql = `
                SELECT 
                    q.topic as skill_type,
                    AVG(CASE 
                        WHEN ur.answers LIKE CONCAT('%', q.question_id, '":true%') THEN 100
                        ELSE 0
                    END) as average_score,
                    COUNT(DISTINCT ur.user_id) as total_assessments
                FROM questions q
                JOIN user_results ur ON q.exam_id = ur.exam_id
                WHERE q.exam_id = ?
                    AND q.topic IN ('listening', 'speaking', 'reading', 'writing')
                GROUP BY q.topic
            `;
            return await query(sql, [examId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch LSRW analytics');
        }
    },

    // Batch Comparison Analytics
    getBatchComparison: async (batchYear, examType) => {
        try {
            const sql = `
                SELECT 
                    u.batch_year,
                    e.exam_name,
                    COUNT(DISTINCT ur.user_id) as total_students,
                    AVG(ur.score) as average_score,
                    COUNT(CASE WHEN ur.score >= 80 THEN 1 END) as high_performers
                FROM user_results ur
                JOIN users u ON ur.user_id = u.user_id
                JOIN exams e ON ur.exam_id = e.exam_id
                WHERE u.batch_year = ? AND e.exam_type = ?
                GROUP BY u.batch_year, e.exam_name
            `;
            return await query(sql, [batchYear, examType]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch batch comparison');
        }
    }
};