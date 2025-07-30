const router = require('express').Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(authenticateToken);

router.get('/', studentController.getStudents);
router.post(
  '/',
  authorizeRole('admin'),
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  studentController.createStudent
);
router.put('/:id', authorizeRole('admin'), studentController.updateStudent);
router.delete('/:id', authorizeRole('admin'), studentController.deleteStudent);
router.post('/bulk-import', authorizeRole('admin'), upload.single('file'), studentController.bulkImportStudents);
router.get('/filter', studentController.filterStudents);

module.exports = router;