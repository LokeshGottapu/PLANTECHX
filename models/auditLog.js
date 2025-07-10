// AuditLog model for logging admin/faculty actions
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const AuditLog = {
  async log({ userId, action, resourceType, resourceId, details, ipAddress }) {
    if (!userId || !action || !resourceType) {
      throw new Error('userId, action, and resourceType are required');
    }

    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute(
        'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, action, resourceType, resourceId, details, ipAddress]
      );
    } catch (err) {
      throw new Error(`Error logging audit: ${err.message}`);
    } finally {
      await connection.end();
    }
  },
  async list({ userId, action, resourceType, resourceId, limit = 100 }) {
    if (limit < 1) {
      throw new Error('Limit must be a positive integer');
    }

    const connection = await mysql.createConnection(dbConfig);
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (userId) { query += ' AND user_id=?'; params.push(userId); }
    if (action) { query += ' AND action=?'; params.push(action); }
    if (resourceType) { query += ' AND resource_type=?'; params.push(resourceType); }
    if (resourceId) { query += ' AND resource_id=?'; params.push(resourceId); }
    query += ' ORDER BY created_at DESC LIMIT ?'; params.push(limit);
    try {
      const [rows] = await connection.execute(query, params);
      await connection.end();
      return rows;
    } catch (err) {
      await connection.end();
      throw new Error(`Error listing audit logs: ${err.message}`);
    }
  }
};

module.exports = AuditLog;
