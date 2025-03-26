require("dotenv").config();
const mysql = require("mysql");
const util = require("util");

const pool = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

const query = util.promisify(pool.query).bind(pool);


module.exports = {

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

            var sql = `INSERT INTO users (`;

            fields.forEach(function fieldsFunction(value) {
                sql += value.key + `, `;
            });

            sql = sql.slice(0, sql.length - 2);
            sql += `) VALUES ?`;

            const result = await query(sql, [[values]]);
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
                            WHERE userId = ${userId} `;

            const result = await query(sql);
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
                        WHERE userId = ${userId} `;

            const result = await query(sql);
            return result;

        } catch (err) {
            console.log(`Database error:`, err);
            throw new Error(`Internal server error`);
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