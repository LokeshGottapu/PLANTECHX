const router = require('express').Router();
const batchController = require('../controllers/batchController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');

router.use(authenticateToken);

router.get('/', batchController.getBatches);
router.post(
  '/',
  authorizeRole('admin'),
  [body('name').notEmpty(), body('college_id').isInt()],
  batchController.createBatch
);
router.put('/:id', authorizeRole('admin'), batchController.updateBatch);
router.delete('/:id', authorizeRole('admin'), batchController.deleteBatch);
router.get('/:id/streams', batchController.getBatchStreams);
router.get('/:id/students', batchController.getBatchStudents);
router.get('/:id/sections', batchController.getBatchSections);

module.exports = router;