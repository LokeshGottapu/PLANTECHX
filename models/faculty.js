const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const facultyModel = {
    async getFacultyContributions(facultyId) {
        let connection = null;
        try {
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const [[contributions]] = await connection.execute(
                `SELECT 
                    COUNT(DISTINCT exams.exam_id) AS exams_created,
                    COUNT(DISTINCT questions.id) AS questions_contributed,
                    COUNT(DISTINCT user_results.user_id) AS students_assessed
                FROM exams
                LEFT JOIN questions ON exams.exam_id = questions.exam_id AND exams.created_by = ?
                LEFT JOIN user_results ON exams.exam_id = user_results.exam_id
                WHERE exams.created_by = ?`,
                [facultyId, facultyId]
            );

            if (!contributions) {
                throw new Error('No contributions found for this faculty');
            }

            return contributions;
        } catch (error) {
            console.error('Error fetching faculty contributions:', error);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    async getFacultyExamStats(facultyId) {
        const connection = await mysql.createConnection(dbConfig);
        // Example: Replace with your actual query logic
        const [examStats] = await connection.execute(
            `SELECT 
                e.exam_name,
                COUNT(ur.user_id) AS total_participants,
                AVG(ur.score) AS average_score,
                SUM(CASE WHEN ur.score >= e.passing_score THEN 1 ELSE 0 END) AS passing_count
            FROM exams e
            JOIN faculty_exams fe ON fe.exam_id = e.exam_id
            LEFT JOIN user_results ur ON ur.exam_id = e.exam_id
            WHERE fe.faculty_id = ?
            GROUP BY e.exam_id`,
            [facultyId]
        );
        await connection.end();
        return examStats;
    },

    async getLSRWAnalytics(examId) {
        const connection = await mysql.createConnection(dbConfig);
        // Example: Replace with your actual query logic
        const [analytics] = await connection.execute(
            `SELECT topic, AVG(score) AS average_score, COUNT(*) AS total_assessments
            FROM lsrw_results
            WHERE exam_id = ?
            GROUP BY topic`,
            [examId]
        );
        await connection.end();
        return analytics;
    },

    async getBatchComparison(batchYear, examType) {
        const connection = await mysql.createConnection(dbConfig);
        // Example: Replace with your actual query logic
        const [comparison] = await connection.execute(
            `SELECT b.batch_year, e.exam_type, AVG(ur.score) AS average_score
            FROM batches b
            JOIN exams e ON b.batch_id = e.batch_id
            JOIN user_results ur ON ur.exam_id = e.exam_id
            WHERE b.batch_year = ? AND e.exam_type = ?
            GROUP BY b.batch_year, e.exam_type`,
            [batchYear, examType]
        );
        await connection.end();
        return comparison;
    }
};

module.exports = facultyModel;