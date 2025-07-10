// Permission model for fine-grained access control
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const Permission = {
  async grant({ userId, resourceType, resourceId, permission, grantedBy }) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!resourceType) {
      throw new Error('Resource type is required');
    }
    if (!permission) {
      throw new Error('Permission is required');
    }
    if (resourceId !== undefined && !resourceId) {
      throw new Error('Resource ID must be a valid string');
    }
    if (grantedBy === undefined) {
      throw new Error('Granted by is required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute(
        'REPLACE INTO permissions (user_id, resource_type, resource_id, permission, granted_by) VALUES (?, ?, ?, ?, ?)',
        [userId, resourceType, resourceId, permission, grantedBy]
      );
    } catch (err) {
      console.error('Error granting permission:', err);
      throw err;
    } finally {
      await connection.end();
    }
  },
  async revoke({ userId, resourceType, resourceId, permission }) {
    if (!userId || !resourceType || !permission) {
      throw new Error('userId, resourceType, and permission are required');
    }
    if (resourceId !== undefined && typeof resourceId !== 'string') {
      throw new Error('Resource ID must be a string if provided');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [result] = await connection.execute(
        'DELETE FROM permissions WHERE user_id=? AND resource_type=? AND (resource_id=? OR resource_id IS NULL) AND permission=?',
        [userId, resourceType, resourceId, permission]
      );
      if (result.affectedRows === 0) {
        throw new Error('No permissions were revoked');
      }
    } catch (err) {
      console.error('Error revoking permission:', err);
      throw new Error('Error revoking permission');
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
  async check({ userId, resourceType, resourceId, permission }) {
    if (!userId || !resourceType || !permission) {
      throw new Error('userId, resourceType, and permission are required');
    }
    if (resourceId !== undefined && typeof resourceId !== 'string') {
      throw new Error('Resource ID must be a string if provided');
    }
    const connection = await mysql.createConnection(dbConfig);
    let rows;
    try {
      [rows] = await connection.execute(
        'SELECT * FROM permissions WHERE user_id=? AND resource_type=? AND (resource_id=? OR resource_id IS NULL) AND permission=?',
        [userId, resourceType, resourceId, permission]
      );
    } catch (err) {
      console.error('Error checking permission:', err);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (endError) {
          console.error('Error closing connection:', endError);
        }
      }
    }
    return rows.length > 0;
  },
  async list({ userId, resourceType }) {
    if (!userId || !resourceType) {
      throw new Error('userId and resourceType are required');
    }
    const connection = await mysql.createConnection(dbConfig);
    let rows;
    try {
      [rows] = await connection.execute(
        'SELECT * FROM permissions WHERE user_id=? AND resource_type=?',
        [userId, resourceType]
      );
    } catch (err) {
      console.error('Error listing permissions:', err);
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.end();
        } catch (endError) {
          console.error('Error closing connection:', endError);
        }
      }
    }
    if (!rows || !Array.isArray(rows)) {
      throw new Error('No permissions were found');
    }
    return rows;
  }
};

module.exports = Permission;
