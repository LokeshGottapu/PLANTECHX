const router = require('express').Router();
const streamController = require('../controllers/streamController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');

router.use(authenticateToken);

router.get('/', streamController.getStreams);
router.post(
  '/',
  authorizeRole('admin'),
  [body('name').notEmpty(), body('college_id').isInt()],
  streamController.createStream
);
router.put('/:id', authorizeRole('admin'), streamController.updateStream);
router.delete('/:id', authorizeRole('admin'), streamController.deleteStream);
router.get('/:id/years', streamController.getStreamYears);
router.get('/:id/sections', streamController.getStreamSections);

module.exports = router;