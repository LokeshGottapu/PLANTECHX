const { body, query, param, validationResult } = require('express-validator');

const validateUserPerformanceRequest = [
    param('userId').isInt().withMessage('User ID must be an integer'),
    query('examType').optional().isString().withMessage('Exam type must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateAIQuestionsRequest = [
    query('topic').notEmpty().isString().withMessage('Topic is required and must be a string'),
    query('numberOfQuestions')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Number of questions must be between 1 and 20'),
    query('difficultyLevel')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty level must be easy, medium, or hard'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validateUserPerformanceRequest,
    validateAIQuestionsRequest
}; 