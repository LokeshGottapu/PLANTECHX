// FAQ model for chatbot management
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const FAQ = {
  async list() {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM faqs').catch((err) => {
      console.error('Error fetching FAQs:', err);
      throw err;
    });
    if (!rows) {
      throw new Error('FAQs is null');
    }
    await connection.end();
    return rows;
  },
  async add({ question, answer }) {
    if (!question || question === null || question === undefined || !answer || answer === null || answer === undefined) {
      throw new Error('Question and answer are required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [result] = await connection.execute('INSERT INTO faqs (question, answer) VALUES (?, ?)', [question, answer]);
      if (!result || !result.insertId) {
        throw new Error('Error adding FAQ');
      }
    } catch (err) {
      console.error('Error adding FAQ:', err);
      throw err;
    }
    await connection.end();
  },

  async update({ id, question, answer }) {
    if (id == null || id === undefined) {
      throw new Error('id is required and cannot be null or undefined');
    }
    if (isNaN(parseInt(id))) {
      throw new Error('id must be an integer');
    }
    if (!question || question === null || question === undefined) {
      throw new Error('question is required');
    }
    if (!answer || answer === null || answer === undefined) {
      throw new Error('answer is required');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('UPDATE faqs SET question=?, answer=? WHERE id=?', [question, answer, id]);
    } catch (err) {
      console.error('Error updating FAQ:', err);
      throw err;

    }
    await connection.end();
  },

  async remove(id) {
    if (id == null || id === undefined) {
      throw new Error('id is required and cannot be null or undefined');
    }
    if (isNaN(parseInt(id))) {
      throw new Error('id must be an integer');
    }
    const connection = await mysql.createConnection(dbConfig);
    try {
      await connection.execute('DELETE FROM faqs WHERE id=?', [id]);
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      throw err;
    }
    await connection.end();
  }
};

module.exports = FAQ;
