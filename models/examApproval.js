// ExamApproval model
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const ExamApproval = {
  async request(examId) {
    if (!examId) {
      throw new Error('Exam ID is required to request approval');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('INSERT INTO exam_approvals (exam_id) VALUES (?)', [examId]);
    } catch (error) {
      console.error('Error requesting exam approval:', error);
      throw error;
    } finally {
      await connection.end();
    }
  },
  async review({ id, status, reviewedBy, remarks }) {
    if (!id || !status || !reviewedBy || remarks === undefined || remarks === null) {
      throw new Error('id, status, reviewedBy, and remarks are required to review exam approval');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('UPDATE exam_approvals SET status=?, reviewed_by=?, reviewed_at=NOW(), remarks=? WHERE id=?', [status, reviewedBy, remarks, id]);
    } catch (error) {
      console.error('Error reviewing exam approval:', error);
      throw error;
    } finally {
      await connection.end();
    }
  },
  async getAll(status) {
    if (status === undefined || status === null) {
      throw new Error('Status is required to get all exam approvals');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute('SELECT * FROM exam_approvals WHERE status=?', [status]);
      if (!rows) {
        throw new Error('No exam approvals found');
      }
      return rows;
    } catch (error) {
      console.error('Error fetching exam approvals:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }
};

module.exports = ExamApproval;
