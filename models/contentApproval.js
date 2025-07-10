// ContentApproval model
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const ContentApproval = {
  async request(contentId) {
    if (!contentId) {
      throw new Error('Content ID is required');
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('INSERT INTO content_approvals (content_id) VALUES (?)', [contentId]);
    } catch (err) {
      console.error('Error requesting content approval:', err);
      throw err;
    } finally {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error closing connection:', endError);
      }
    }
  },
  async review({ id, status, reviewedBy, remarks }) {
    if (!id || !status || !reviewedBy || typeof remarks !== 'string') {
      throw new Error('id, status, reviewedBy, and remarks are required');
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('UPDATE content_approvals SET status=?, reviewed_by=?, reviewed_at=NOW(), remarks=? WHERE id=?', [status, reviewedBy, remarks, id]);
    } catch (err) {
      console.error('Error reviewing content approval:', err);
      throw err;
    } finally {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error closing connection:', endError);
      }
    }
  },
  async getAll(status) {
    if (typeof status !== 'string') {
      throw new Error('status is a required string parameter');
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute('SELECT * FROM content_approvals WHERE status=?', [status]);
      if (!rows) {
        throw new Error('No content approvals found');
      }

      return rows;
    } catch (err) {
      console.error('Error fetching content approvals:', err);
      throw err;
    } finally {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error closing connection:', endError);
      }
    }
  }
};

module.exports = ContentApproval;
