const db = require('../config/database');

const Course = {
  create: async (data) => {
    if (!data) {
      throw new Error('Missing required fields to create a course');
    }
    if (!data.name || !data.description || data.status === undefined || data.created_by === undefined) {
      throw new Error('Missing required fields to create a course');
    }
    if (typeof data.name !== 'string' || typeof data.description !== 'string' || typeof data.status !== 'string' || typeof data.created_by !== 'number') {
      throw new Error('Invalid data type for course creation');
    }

    const [result] = await db.query(
      'INSERT INTO courses (name, description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [data.name, data.description, data.status || 'active', data.created_by]
    );
    if (!result || result.affectedRows === 0) {
      throw new Error('Failed to create course');
    }
    return result.insertId;
  },

  update: async (id, data) => {
    if (!id || !data) {
      throw new Error('ID and data are required for updating a course');
    }
    if (!data.name || !data.description || data.status === undefined) {
      throw new Error('Missing required fields for course update');
    }
    try {
      const [result] = await db.query(
        'UPDATE courses SET name=?, description=?, status=?, updated_at=NOW() WHERE id=?',
        [data.name, data.description, data.status, id]
      );
      if (!result || result.affectedRows === 0) {
        throw new Error('Course not found or no changes made');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      throw new Error('Error updating course');
    }
  },

  delete: async (id) => {
    if (!id) {
      throw new Error('ID is required for deleting a course');
    }
    try {
      const [result] = await db.query('DELETE FROM courses WHERE id=?', [id]);
      if (!result || result.affectedRows === 0) {
        throw new Error('Course not found');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      throw new Error('Error deleting course');
    }
  },

  getAll: async () => {
    try {
      const [rows] = await db.query('SELECT * FROM courses');
      if (!rows) {
        throw new Error('No courses found');
      }
      return rows;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Error fetching courses');
    }
  },

  getById: async (id) => {
    if (!id) {
      throw new Error('ID is required to get course details');
    }
    try {
      const [rows] = await db.query('SELECT * FROM courses WHERE id=?', [id]);
      if (!rows || rows.length === 0) {
        throw new Error('Course not found');
      }
      return rows[0];
    } catch (error) {
      console.error('Error fetching course by ID:', error);
      throw new Error('Error fetching course');
    }
  }
};

module.exports = Course;
