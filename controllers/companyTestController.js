// Controller for Company Specific Section (e.g., TCS, Infosys, etc.)
const CompanyTest = require('../models/companyTest');

const companyTestController = {
  async list(req, res) {
    try {
      const { company, topic } = req.query;
      const tests = await CompanyTest.list({ company, topic });
      res.json(tests);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching company tests', error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const test = await CompanyTest.getById(id);
      if (!test) return res.status(404).json({ message: 'Company test not found' });
      res.json(test);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching company test', error: err.message });
    }
  },

  async add(req, res) {
    try {
      // Only admin/master admin
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { company, topic, name, questions } = req.body;
      const id = await CompanyTest.add({ company, topic, name, questions });
      res.json({ message: 'Company test created', id });
    } catch (err) {
      res.status(500).json({ message: 'Error creating company test', error: err.message });
    }
  },

  async update(req, res) {
    try {
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { id } = req.params;
      const { company, topic, name, questions } = req.body;
      await CompanyTest.update({ id, company, topic, name, questions });
      res.json({ message: 'Company test updated' });
    } catch (err) {
      res.status(500).json({ message: 'Error updating company test', error: err.message });
    }
  },

  async remove(req, res) {
    try {
      if (!['admin', 'master_admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      const { id } = req.params;
      await CompanyTest.remove(id);
      res.json({ message: 'Company test deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting company test', error: err.message });
    }
  }
};

module.exports = companyTestController;
