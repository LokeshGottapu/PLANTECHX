// Controller for Assessment Section (Arithmetic, Verbal, Reasoning, Coding)
const AssessmentTest = require('../models/assessmentTest');

const assessmentTestController = {
  async list(req, res) {
    try {
      const { section, topic } = req.query;
      const tests = await AssessmentTest.list({ section, topic });
      res.json(tests);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching assessment tests', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const test = await AssessmentTest.getById(id);
      if (!test) return res.status(404).json({ message: 'Assessment test not found' });
      res.json(test);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching assessment test', error: err.message });
    }
  },

  async add(req, res) {
    try {
      // Only admin/master admin
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { section, topic, name, questions } = req.body;
      const id = await AssessmentTest.add({ section, topic, name, questions });
      res.json({ message: 'Assessment test created', id });
    } catch (err) {
      res.status(500).json({ message: 'Error creating assessment test', error: err.message });
    }
  },

  async update(req, res) {
    try {
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { id } = req.params;
      const { section, topic, name, questions } = req.body;
      await AssessmentTest.update({ id, section, topic, name, questions });
      res.json({ message: 'Assessment test updated' });
    } catch (err) {
      res.status(500).json({ message: 'Error updating assessment test', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { id } = req.params;
      await AssessmentTest.remove(id);
      res.json({ message: 'Assessment test deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting assessment test', error: err.message });
    }
  }
};

module.exports = assessmentTestController;
