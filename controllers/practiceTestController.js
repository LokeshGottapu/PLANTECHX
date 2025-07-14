// Controller for Practice Section (Arithmetic, Reasoning, Verbal, Coding)
const PracticeTest = require('../models/practiceTest');

const practiceTestController = {
  async list(req, res) {
    try {
      const { section, topic } = req.query;
      const tests = await PracticeTest.list({ section, topic });
      res.json(tests);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching practice tests', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const test = await PracticeTest.getById(id);
      if (!test) return res.status(404).json({ message: 'Practice test not found' });
      res.json(test);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching practice test', error: err.message });
    }
  },

  async add(req, res) {
    try {
      // Only admin/master admin
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { section, topic, name, questions } = req.body;
      const id = await PracticeTest.add({ section, topic, name, questions });
      res.json({ message: 'Practice test created', id });
    } catch (err) {
      res.status(500).json({ message: 'Error creating practice test', error: err.message });
    }
  },

  async update(req, res) {
    try {
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { id } = req.params;
      const { section, topic, name, questions } = req.body;
      await PracticeTest.update({ id, section, topic, name, questions });
      res.json({ message: 'Practice test updated' });
    } catch (err) {
      res.status(500).json({ message: 'Error updating practice test', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { id } = req.params;
      await PracticeTest.remove(id);
      res.json({ message: 'Practice test deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting practice test', error: err.message });
    }
  }
};

module.exports = practiceTestController;
