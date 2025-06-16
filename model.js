require("dotenv").config();
const mysql = require("mysql2");
const util = require("util");
const { toLower, lowerFirst, isEmpty, last } = require("lodash");

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});
const query = util.promisify(pool.query).bind(pool);


module.exports = {
    query,

    getUserByEmail: async (email) => {
        try {
            const sql = 'SELECT * FROM users WHERE email = ?';
            const result = await query(sql, [email]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to get user by email.');
        }
    },

    getUsers: async () => {

        try {

            var sql = ` SELECT * 
                        FROM users `;

            const result = await query(sql);
            return result;

        } catch (err) {
            console.error("Database error:", err);
            throw new Error("Failed to get users.");
        }

    },

    postUser: async (fields, values) => {

        try {
            // Ensure createdAt and updatedAt are present
            const fieldNames = fields.map(field => field.key);
            let sqlFields = [...fields];
            let sqlValues = [...values];
            let nowFields = [];
            if (!fieldNames.includes('createdAt')) {
                nowFields.push('createdAt');
            }
            if (!fieldNames.includes('updatedAt')) {
                nowFields.push('updatedAt');
            }
            let sql;
            if (nowFields.length > 0) {
                sql = `INSERT INTO users (${[...fieldNames, ...nowFields].join(", ")}) VALUES (${[...values.map(() => '?'), ...nowFields.map(() => 'NOW()')].join(", ")})`;
            } else {
                sql = `INSERT INTO users (${fieldNames.join(", ")}) VALUES (${values.map(() => '?').join(", ")})`;
            }
            const result = await query(sql, sqlValues);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    getUser: async (userId) => {

        try {

            var sql = ` SELECT * 
                            FROM users 
                            WHERE userId = ? `;

            const result = await query(sql, [userId]);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    putUser: async (userId, fields, values) => {

        try {

            var sql = `UPDATE users SET `;

            const updateValues = fields.map(field => `${field.key} = ?`).join(", ");
            sql += updateValues;
            sql += ` WHERE userId = ?`;

            const result = await query(sql, [...values, userId]);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    deleteUser: async (userId) => {

        try {

            var sql = ` DELETE FROM users 
                        WHERE userId = ? `;

            const result = await query(sql, [userId]);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    getExamName: async (examName, userId) => {

        try {

            var sql = ` SELECT * 
                        FROM exams 
                        WHERE LOWER(examName) LIKE "${'%' + toLower(examName) + '%'}" 
                        AND examId NOT IN 
                        ( SELECT examId FROM exams_to_user WHERE userID = ? ) `;

            const result = await query(sql, userId);
            console.log(result);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    postExamToUser: async (fields, values) => {

        try {

            var sql = `INSERT INTO exams_to_user (${fields.map(field => field.key).join(", ")}) 
                        VALUES (${values.map(() => '?').join(", ")})`;

            const result = await query(sql, values);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    getUserDetails: async (userId) => {

        try {

            var sql = ` SELECT firstName, lastName, department, year, semester, section 
                        FROM users 
                        WHERE userId = ? `;

            const result = await query(sql, userId);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },

    getExamsToUser: async (userId) => {

        try {

            var sql = ` SELECT exams.examId, exams.examName 
                        FROM exams_to_user 
                        INNER JOIN users 
                        ON users.userID = exams_to_user.userID 
                        INNER JOIN exams 
                        ON exams.examId = exams_to_user.examId 
                        WHERE users.userId = ? `;

            const result = await query(sql, userId);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
        }

    },






    // Faculty Analytics Functions
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
}

// // ✅ Using `query` for a simple SELECT statement
// async function getUsers() {
//     try {
//         const results = await query("SELECT * FROM users");
//         console.log("Users:", results);
//     } catch (err) {
//         console.error("Error fetching users:", err.message);
//     }
// }

// // ✅ Using `pool.getConnection()` for a transaction (multiple dependent queries)
// async function addUserAndPost(userName, postContent) {
//     const connection = await pool.getConnection();
//     try {
//         await connection.beginTransaction(); // Start transaction

//         const userResult = await connection.query("INSERT INTO users (name) VALUES (?)", [userName]);
//         const userId = userResult.insertId;

//         await connection.query("INSERT INTO posts (user_id, content) VALUES (?, ?)", [userId, postContent]);

//         await connection.commit(); // Commit transaction
//         console.log("User and post added successfully!");
//     } catch (err) {
//         await connection.rollback(); // Rollback if any query fails
//         console.error("Transaction failed:", err.message);
//     } finally {
//         connection.release(); // Release connection back to the pool
//     }
// }

// // Call the functions
// getUsers();
// addUserAndPost("John Doe", "This is John's first post.");