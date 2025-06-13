const examModel = require('../models/examModel');
const { validationResult } = require('express-validator');
const QuestionGenerator = require('../services/QuestionGenerator');
const Question = require('../models/Question');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

module.exports = {
    // Exam Management
    createExam: async (req, res) => {
        let connection;
        try {
            const { title, description, duration, totalMarks, passingMarks } = req.body;
            const facultyId = req.user.id;

            if (!title || !duration || !totalMarks || !passingMarks) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            connection = await mysql.createConnection(dbConfig);

            const [result] = await connection.execute(
                'INSERT INTO exams (title, description, duration, total_marks, passing_marks, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
                [title, description, duration, totalMarks, passingMarks, facultyId]
            );

            res.status(201).json({
                message: 'Exam created successfully',
                examId: result.insertId
            });
        } catch (error) {
            console.error('Error creating exam:', error);
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
            const { examId } = req.params;
            const { question, options, correctAnswer, marks } = req.body;

            if (!question || !options || !correctAnswer || !marks) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            if (!Array.isArray(options) || options.length < 2) {
                return res.status(400).json({ message: 'At least 2 options are required' });
            }

            connection = await mysql.createConnection(dbConfig);

            // Check if exam exists and belongs to the faculty
            const [exams] = await connection.execute(
                'SELECT * FROM exams WHERE id = ? AND faculty_id = ?',
                [examId, req.user.id]
            );

            if (exams.length === 0) {
                return res.status(404).json({ message: 'Exam not found or unauthorized' });
            }

            const [result] = await connection.execute(
                'INSERT INTO questions (exam_id, question_text, options, correct_answer, marks) VALUES (?, ?, ?, ?, ?)',
                [examId, question, JSON.stringify(options), correctAnswer, marks]
            );

            res.status(201).json({
                message: 'Question added successfully',
                questionId: result.insertId
            });
        } catch (error) {
            console.error('Error adding question:', error);
            res.status(500).json({ message: 'Error adding question' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // AI Question Generation
    generateQuestions: async (req, res) => {
        try {
            const { examId, content, topic, numberOfQuestions } = req.body;

            if (!content || !topic || !examId) {
                return res.status(400).json({
                    message: 'Content, topic, and examId are required'
                });
            }

            const generatedQuestions = await QuestionGenerator.generateAndSaveQuestions(
                content,
                examId,
                topic,
                numberOfQuestions || 5
            );

            const savedQuestions = await Question.bulkCreate(generatedQuestions);

            res.status(201).json({
                message: 'Questions generated and saved successfully',
                questions: savedQuestions
            });
        } catch (error) {
            console.error('Question generation error:', error);
            res.status(500).json({
                message: 'Error generating questions',
                error: error.message
            });
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
                return res.status(400).json({ message: 'Invalid answers format' });
            }

            connection = await mysql.createConnection(dbConfig);

            // Get exam details and questions
            const [exams] = await connection.execute(
                'SELECT * FROM exams WHERE id = ?',
                [examId]
            );

            if (exams.length === 0) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            const exam = exams[0];

            // Get all questions for the exam
            const [questions] = await connection.execute(
                'SELECT * FROM questions WHERE exam_id = ?',
                [examId]
            );

            // Calculate score
            let totalScore = 0;
            answers.forEach(answer => {
                const question = questions.find(q => q.id === answer.questionId);
                if (question && question.correct_answer === answer.selectedAnswer) {
                    totalScore += question.marks;
                }
            });

            // Save result
            const passed = totalScore >= exam.passing_marks;
            await connection.execute(
                'INSERT INTO user_results (user_id, exam_id, score, passed) VALUES (?, ?, ?, ?)',
                [userId, examId, totalScore, passed]
            );

            res.json({
                message: 'Exam submitted successfully',
                score: totalScore,
                totalMarks: exam.total_marks,
                passed
            });
        } catch (error) {
            console.error('Error submitting exam:', error);
            res.status(500).json({ message: 'Error submitting exam' });
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    },

    // Performance Analytics
    // Student Performance Reports
    getUserPerformance: async (req, res) => {
        let connection;
        try {
            const { userId } = req.params;

            // Only allow users to view their own performance unless admin
            if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            connection = await mysql.createConnection(dbConfig);

            const [results] = await connection.execute(
                `SELECT ur.*, e.title, e.total_marks, e.passing_marks 
                 FROM user_results ur 
                 JOIN exams e ON ur.exam_id = e.id 
                 WHERE ur.user_id = ?`,
                [userId]
            );

            res.json({
                message: 'Performance data retrieved successfully',
                results
            });
        } catch (error) {
            console.error('Error getting user performance:', error);
            res.status(500).json({ message: 'Error retrieving performance data' });
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

    // AI Question Generation
    generateAIQuestions: async (req, res) => {
        try {
            const { subject, topic, difficulty, count } = req.body;

            if (!subject || !topic || !difficulty || !count) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // TODO: Implement AI question generation using OpenAI or similar service

            res.status(501).json({ message: 'AI question generation not implemented yet' });
        } catch (error) {
            console.error('Error generating AI questions:', error);
            res.status(500).json({ message: 'Error generating questions' });
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