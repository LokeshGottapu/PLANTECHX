const examRouter = require('express').Router();
const examController = require('../controllers/examController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');

// Protect all exam routes with authentication
examRouter.use(authenticateToken);

// Exams CRUD
examRouter.get('/', examController.getAllExams);
examRouter.post(
  '/',
  authorizeRole('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be a positive integer')
  ],
  examController.createExam
);
examRouter.get('/:examId', examController.getExamById);
examRouter.put(
  '/:examId',
  authorizeRole('admin'),
  [
    body('title').optional().notEmpty(),
    body('duration').optional().isInt({ min: 1 }),
    body('totalMarks').optional().isInt({ min: 1 })
  ],
  examController.updateExam
);
examRouter.delete('/:examId', authorizeRole('admin'), examController.deleteExam);

// Exam categories and types
examRouter.get('/categories', examController.getExamCategories);
examRouter.get('/practice', examController.getPracticeExams);
examRouter.get('/assessment', examController.getAssessmentExams);
examRouter.get('/mock', examController.getMockExams);
examRouter.get('/company-specific', examController.getCompanySpecificExams);

// Assign exam to students or groups
examRouter.post('/:examId/assign', authorizeRole('admin'), examController.assignExam);

// Exam reports
examRouter.get('/:examId/reports', authorizeRole('admin'), examController.getExamReports);

// Duplicate exam
examRouter.post('/:examId/duplicate', authorizeRole('admin'), examController.duplicateExam);

module.exports = examRouter;