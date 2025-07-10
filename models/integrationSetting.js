// IntegrationSetting model for third-party API keys
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const IntegrationSetting = {
  async set({ collegeId, provider, apiKey, apiSecret }) {
    if (!collegeId) {
      throw new Error('collegeId is required');
    }
    if (!provider) {
      throw new Error('provider is required');
    }
    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    if (!apiSecret) {
      throw new Error('apiSecret is required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute(
        'REPLACE INTO integration_settings (college_id, provider, api_key, api_secret) VALUES (?, ?, ?, ?)',
        [collegeId, provider, apiKey, apiSecret]
      );
    } catch (err) {
      throw new Error(`Error saving integration setting: ${err.message}`);
    } finally {
      await connection.end();
    }
  },
  async get({ collegeId, provider }) {
    if (!collegeId) {
      throw new Error('collegeId is required');
    }
    if (!provider) {
      throw new Error('provider is required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM integration_settings WHERE college_id = ? AND provider = ?',
        [collegeId, provider]
      );
      if (rows.length === 0) {
        return null;
      }
      return rows[0];
    } catch (err) {
      throw new Error(`Error fetching integration setting: ${err.message}`);
    } finally {
      await connection.end();
    }
  },
  async list({ collegeId }) {
    if (!collegeId) {
      throw new Error('collegeId is required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM integration_settings WHERE college_id = ?',
        [collegeId]
      );
      return rows;
    } catch (err) {
      throw new Error(`Error listing integration settings: ${err.message}`);
    } finally {
      await connection.end();
    }
  }
};

module.exports = IntegrationSetting;
