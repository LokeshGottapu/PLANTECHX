// Practice Test model for self-paced practice/mock tests
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const PracticeTest = {
  async list({ section, topic }) {
    const connection = await mysql.createConnection(dbConfig);
    let query = 'SELECT * FROM practice_tests WHERE 1=1';
    const params = [];
    if (section) {
      query += ' AND section = ?';
      params.push(section);
    }
    if (topic) {
      query += ' AND topic = ?';
      params.push(topic);
    }
    const [rows] = await connection.execute(query, params);
    await connection.end();
    return rows;
  },

  async add({ section, topic, name, questions }) {
    if (!section || !topic || !name || !questions) {
      throw new Error('All fields are required');
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO practice_tests (section, topic, name, questions) VALUES (?, ?, ?, ?)',
      [section, topic, name, JSON.stringify(questions)]
    );
    await connection.end();
    return result.insertId;
  },

  async update({ id, section, topic, name, questions }) {
    if (!id) throw new Error('id is required');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE practice_tests SET section=?, topic=?, name=?, questions=? WHERE id=?',
      [section, topic, name, JSON.stringify(questions), id]
    );
    await connection.end();
  },

  async remove(id) {
    if (!id) throw new Error('id is required');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM practice_tests WHERE id=?', [id]);
    await connection.end();
  },

  async getById(id) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM practice_tests WHERE id=?', [id]);
    await connection.end();
    return rows[0];
  }
};

module.exports = PracticeTest;
