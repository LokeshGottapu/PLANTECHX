// FacultyApproval model
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const FacultyApproval = {
  async request(facultyId) {
    if (facultyId === null || facultyId === undefined) {
      throw new Error('Faculty ID is required');
    }
    if (!Number.isInteger(facultyId)) {
      throw new Error('Faculty ID must be an integer');
    }
    if (facultyId < 1) {
      throw new Error('Faculty ID must be a positive integer');
    }
    const connection = await mysql.createConnection(dbConfig);
    if (!connection) {
      throw new Error('Database connection failed');
    }
    try {
      await connection.execute('INSERT INTO faculty_approvals (faculty_id) VALUES (?)', [facultyId]);
    } catch (error) {
      console.error('Error requesting faculty approval:', error);
      throw error;
    } finally {
      await connection.end();
    }
  },
  async review({ id, status, reviewedBy, remarks }) {
    if (id === null || id === undefined) {
      throw new Error('id is required');
    }
    if (status === null || status === undefined) {
      throw new Error('status is required');
    }
    if (reviewedBy === null || reviewedBy === undefined) {
      throw new Error('reviewedBy is required');
    }
    if (remarks === null || remarks === undefined || typeof remarks !== 'string') {
      throw new Error('remarks must be a non null string');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('UPDATE faculty_approvals SET status=?, reviewed_by=?, reviewed_at=NOW(), remarks=? WHERE id=?', [status, reviewedBy, remarks, id]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Faculty approval with the same ID already exists');
      } else if (error.code === 'ER_BAD_NULL_ERROR') {
        throw new Error('Null value not allowed');
      } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new Error('Faculty ID does not exist');
      } else {
        console.error('Error reviewing faculty approval:', error);
        throw error;
      }
    } finally {
      await connection.end();
    }
  },
  async getAll(status) {
    if (status === null || status === undefined) {
      throw new Error('status is required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute('SELECT * FROM faculty_approvals WHERE status=?', [status]);
      if (!rows || rows.length === 0) {
        throw new Error('No faculty approvals found');
      }
      return rows;
    } catch (error) {
      console.error('Error fetching faculty approvals:', error);
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
  }
};

module.exports = FacultyApproval;
