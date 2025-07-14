// Company Specific Test model
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const CompanyTest = {
  async list({ company, topic }) {
    const connection = await mysql.createConnection(dbConfig);
    let query = 'SELECT * FROM company_tests WHERE 1=1';
    const params = [];
    if (company) {
      query += ' AND company = ?';
      params.push(company);
    }
    if (topic) {
      query += ' AND topic = ?';
      params.push(topic);
    }
    const [rows] = await connection.execute(query, params);
    await connection.end();
    return rows;
  },

  async add({ company, topic, name, questions }) {
    if (!company || !topic || !name || !questions) {
      throw new Error('All fields are required');
    }
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      'INSERT INTO company_tests (company, topic, name, questions) VALUES (?, ?, ?, ?)',
      [company, topic, name, JSON.stringify(questions)]
    );
    await connection.end();
    return result.insertId;
  },

  async update({ id, company, topic, name, questions }) {
    if (!id) throw new Error('id is required');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'UPDATE company_tests SET company=?, topic=?, name=?, questions=? WHERE id=?',
      [company, topic, name, JSON.stringify(questions), id]
    );
    await connection.end();
  },

  async remove(id) {
    if (!id) throw new Error('id is required');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM company_tests WHERE id=?', [id]);
    await connection.end();
  },

  async getById(id) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM company_tests WHERE id=?', [id]);
    await connection.end();
    return rows[0];
  }
};

module.exports = CompanyTest;
