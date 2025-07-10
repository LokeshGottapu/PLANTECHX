// FeatureToggle model for enabling/disabling LSRW, SWOT, AI at college or user level
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const FeatureToggle = {
  // Set feature status (enabled/disabled) for a college or user
  async set({ feature, enabled, collegeId = null, userId = null }) {
    if (!feature || typeof enabled === 'undefined' || (!collegeId && !userId)) {
      throw new Error('feature, enabled, and collegeId or userId are required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute(
        `REPLACE INTO feature_toggles (feature, enabled, college_id, user_id) VALUES (?, ?, ?, ?)`,
        [feature, enabled ? 1 : 0, collegeId, userId]
      );
    } catch (error) {
      console.error('Error setting feature toggle:', error);
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

  // Get feature status for a college or user
  async get({ feature, collegeId = null, userId = null }) {
    if (!feature || (!collegeId && !userId)) {
      throw new Error('feature and collegeId or userId are required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute(
        `SELECT enabled FROM feature_toggles WHERE feature = ? AND (college_id = ? OR user_id = ?)`,
        [feature, collegeId, userId]
      );
      if (rows.length > 0) return !!rows[0].enabled;
      return null; // Not set
    } catch (error) {
      console.error('Error getting feature toggle:', error);
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

  // List all toggles for a college or user
  async list({ collegeId = null, userId = null }) {
    if (!collegeId && !userId) {
      throw new Error('collegeId or userId required');
    }
    if (collegeId === null) {
      throw new TypeError('collegeId must not be null or undefined');
    }
    if (userId === null) {
      throw new TypeError('userId must not be null or undefined');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute(
        `SELECT feature, enabled FROM feature_toggles WHERE college_id = ? OR user_id = ?`,
        [collegeId, userId]
      );
      return rows;
    } catch (error) {
      console.error('Error listing feature toggles:', error);
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

module.exports = FeatureToggle;
