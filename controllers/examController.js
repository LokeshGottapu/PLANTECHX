const { validationResult } = require('express-validator');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const crypto = require('crypto');

module.exports = {
    // Exam Management
    createExam: async (req, res) => {
        let connection;
        try {
            const { title, description, duration, totalMarks } = req.body;
            const userId = req.user.id;

            if (!title || !duration || !totalMarks) {
                return res.status(400).json({ message: 'Title, duration, and total marks are required' });
            }

            connection = await mysql.createConnection(dbConfig);

            const [result] = await connection.execute(
                'INSERT INTO exams (exam_name, exam_type, total_questions, duration, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, 'standard', totalMarks, duration, userId]
            );

            res.status(201).json({
                message: 'Exam created successfully',
                examId: result.insertId
            });
        } catch (error) {
            console.error('Create exam error:', error);
            res.status(500).json({ message: 'Error creating exam' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // Question Management
    addQuestion: async (req, res) => {
        let connection;
        try {
            const { examId, questionText, questionType, options, correctAnswer, difficultyLevel, topic } = req.body;
            
            if (!examId || !questionText || !questionType || !options || !correctAnswer || !difficultyLevel || !topic) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'All fields are required'
                });
            }

            connection = await mysql.createConnection(dbConfig);
            
            const [result] = await connection.execute(
                'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, difficulty_level, topic) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [examId, questionText, questionType, JSON.stringify(options), correctAnswer, difficultyLevel, topic]
            );

            res.status(201).json({
                message: 'Question added successfully',
                questionId: result.insertId,
                requestId: crypto.randomBytes(16).toString('hex')
            });
        } catch (error) {
            console.error('Add question error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
                requestId: crypto.randomBytes(16).toString('hex')
            });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // AI Question Generation
    generateAIQuestions: async (req, res) => {
        let connection;
        try {
            const { examId, count = 5 } = req.body;

            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);

            // Check if exam exists and user is authorized
            const [exams] = await connection.execute(
                'SELECT * FROM exams WHERE exam_id = ? AND created_by = ?',
                [examId, req.user.id]
            );

            if (exams.length === 0) {
                return res.status(404).json({ message: 'Exam not found or unauthorized' });
            }

            // TODO: Implement AI question generation
            res.json({ message: 'AI question generation not implemented yet' });
        } catch (error) {
            console.error('Generate AI questions error:', error);
            res.status(500).json({ message: 'Error generating AI questions' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // Take Exam
    submitExam: async (req, res) => {
        let connection;
        try {
            const { examId } = req.params;
            const { answers } = req.body;
            const userId = req.user.id;

            if (!answers || !Array.isArray(answers)) {
                return res.status(400).json({ message: 'Answers are required' });
            }

            connection = await mysql.createConnection(dbConfig);

            // Get exam questions
            const [questions] = await connection.execute(
                'SELECT * FROM questions WHERE exam_id = ?',
                [examId]
            );

            if (questions.length === 0) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            // Calculate score
            let score = 0;
            const userAnswers = answers.map(answer => {
                const question = questions.find(q => q.question_id === answer.questionId);
                const isCorrect = question && question.correct_answer === answer.answer;
                if (isCorrect) {
                    score += question.marks;
                }
                return {
                    questionId: answer.questionId,
                    answer: answer.answer,
                    isCorrect
                };
            });

            // Save result
            const [result] = await connection.execute(
                'INSERT INTO user_results (user_id, exam_id, score, answers) VALUES (?, ?, ?, ?)',
                [userId, examId, score, JSON.stringify(userAnswers)]
            );

            res.json({
                message: 'Exam submitted successfully',
                score,
                totalQuestions: questions.length,
                correctAnswers: userAnswers.filter(a => a.isCorrect).length
            });
        } catch (error) {
            console.error('Submit exam error:', error);
            res.status(500).json({ message: 'Error submitting exam' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // Performance Analytics
    getUserPerformance: async (req, res) => {
        let connection;
        try {
            const { userId } = req.params;
            const { examType, startDate, endDate } = req.query;
            
            let query = `
                SELECT e.exam_name, e.exam_type, ur.score, ur.completion_time, ur.completed_at
                FROM user_results ur
                JOIN exams e ON ur.exam_id = e.exam_id
                WHERE ur.user_id = ?
            `;
            const params = [userId];

            if (examType) {
                query += ' AND e.exam_type = ?';
                params.push(examType);
            }

            if (startDate) {
                query += ' AND ur.completed_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND ur.completed_at <= ?';
                params.push(endDate);
            }

            query += ' ORDER BY ur.completed_at DESC';

            connection = await mysql.createConnection(dbConfig);
            const [results] = await connection.execute(query, params);

            res.json({
                data: results,
                requestId: crypto.randomBytes(16).toString('hex')
            });
        } catch (error) {
            console.error('Get user performance error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'An unexpected error occurred',
                requestId: crypto.randomBytes(16).toString('hex')
            });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    getBatchComparison: async (req, res) => {
        try {
            const { batchYear, examType } = req.query;
            const comparison = await examModel.getBatchComparison(batchYear, examType);
            res.json(comparison);
        } catch (error) {
            console.error('Get batch comparison error:', error);
            res.status(500).json({ message: 'Error fetching batch comparison' });
        }
    },

    // Faculty Reports
    getFacultyPerformance: async (req, res) => {
        try {
            const facultyId = req.params.facultyId;
            const performance = await examModel.getFacultyPerformance(facultyId);
            res.json(performance);
        } catch (error) {
            console.error('Get faculty performance error:', error);
            res.status(500).json({ message: 'Error fetching faculty performance' });
        }
    },

    // LSRW Analytics
    getLSRWPerformance: async (req, res) => {
        try {
            const { userId, examId } = req.params;
            const performance = await examModel.getLSRWPerformance(userId, examId);
            res.json(performance);
        } catch (error) {
            console.error('Get LSRW performance error:', error);
            res.status(500).json({ message: 'Error fetching LSRW performance' });
        }
    },

    // Exam Success Analytics
    getExamSuccessMetrics: async (req, res) => {
        try {
            const { examId } = req.params;
            const metrics = await examModel.getExamSuccessMetrics(examId);
            res.json(metrics);
        } catch (error) {
            console.error('Get exam metrics error:', error);
            res.status(500).json({ message: 'Error fetching exam metrics' });
        }
    },

    // Exam Scheduling
    rescheduleExam: async (req, res) => {
        try {
            const { examId, newDate } = req.body;
            await examModel.rescheduleExam(examId, newDate);
            res.json({ message: 'Exam rescheduled successfully' });
        } catch (error) {
            console.error('Reschedule exam error:', error);
            res.status(500).json({ message: 'Error rescheduling exam' });
        }
    },

    // Retake Management
    checkRetakeEligibility: async (req, res) => {
        try {
            const { examId } = req.params;
            const userId = req.user.userId;
            
            const eligibility = await examModel.checkRetakeEligibility(userId, examId);
            if (!eligibility) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            const canRetake = eligibility.attempt_count < eligibility.max_retakes;
            res.json({
                canRetake,
                attemptsUsed: eligibility.attempt_count,
                maxRetakes: eligibility.max_retakes
            });
        } catch (error) {
            console.error('Check retake eligibility error:', error);
            res.status(500).json({ message: 'Error checking retake eligibility' });
        }
    },

    // Get Randomized Questions
    getExamQuestions: async (req, res) => {
        try {
            const { examId } = req.params;
            const questions = await examModel.getRandomizedQuestions(examId);
            res.json(questions);
        } catch (error) {
            console.error('Get exam questions error:', error);
            res.status(500).json({ message: 'Error fetching exam questions' });
        }
    },

    // AI Question Suggestions
    getAISuggestedQuestions: async (req, res) => {
        try {
            const { topic } = req.query;
            const userId = req.user.userId;

            const questions = await examModel.getAISuggestedQuestions(userId, topic);
            res.json(questions);
        } catch (error) {
            console.error('Get AI questions error:', error);
            res.status(500).json({ message: 'Error fetching AI suggested questions' });
        }
    },

    // Helper function to validate date format
    isValidDate: (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
};

// Helper function to calculate exam score
async function calculateScore(examId, userAnswers) {
    try {
        // Implement score calculation logic based on correct answers
        // This is a placeholder implementation
        return 75; // Example score
    } catch (error) {
        console.error('Score calculation error:', error);
        throw new Error('Failed to calculate score');
    }
}