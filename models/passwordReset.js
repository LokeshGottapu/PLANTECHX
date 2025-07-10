// PasswordReset model for handling password reset tokens
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const PasswordReset = {
  async create({ userId, token, expiresAt }) {
    if (!userId || !token || !expiresAt) {
      throw new Error('Missing required parameters');
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );
    } catch (error) {
      console.error('Error creating password reset entry:', error);
      throw new Error('Database operation failed');
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (endError) {
          console.error('Error closing the database connection:', endError);
        }
      }
    }
  },
  async findByToken(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
        [token]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      return rows[0];
    } catch (error) {
      console.error('Error finding password reset entry:', error);
      throw new Error('Database operation failed');
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (endError) {
          console.error('Error closing the database connection:', endError);
        }
      }
    }
  },
  async markUsed(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    let connection;
    try {
      connection = await mysql.createConnection(dbConfig);
      await connection.execute(
        'UPDATE password_resets SET used = 1 WHERE token = ?',
        [token]
      );
    } catch (error) {
      console.error('Error marking password reset entry as used:', error);
      throw new Error('Database operation failed');
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (endError) {
          console.error('Error closing the database connection:', endError);
        }
      }
    }
  }
};

module.exports = PasswordReset;
