const { validationResult } = require('express-validator');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const crypto = require('crypto');
const axios = require('axios');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

module.exports = {
    // Exam Management
    createExam: async (req, res) => {
        let connection = null;
        try {
            const { title, description, duration, totalMarks } = req.body;
            const userId = req.user?.id;

            if (!title || !duration || !totalMarks) {
                return res.status(400).json({ message: 'Title, duration, and total marks are required' });
            }

            connection = await mysql.createConnection(dbConfig);

            if (!connection) {
                throw new Error('Could not connect to database');
            }

            const [result] = await connection.execute(
                'INSERT INTO exams (exam_name, exam_type, total_questions, duration, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, 'standard', totalMarks, duration, userId]
            );

            if (!result || !result.insertId) {
                throw new Error('Error creating exam');
            }

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
        let connection = null;
        try {
            const { examId, questionText, questionType, options, correctAnswer, difficultyLevel, topic } = req.body;

            if (!examId || !questionText || !questionType || !options || !correctAnswer || !difficultyLevel || !topic) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'All fields are required'
                });
            }

            if (!Array.isArray(options) || options.length === 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Options must be an array with at least one element'
                });
            }

            if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'Correct answer must be a valid index of the options array'
                });
            }

            connection = await mysql.createConnection(dbConfig);

            if (!connection) {
                throw new Error('Could not connect to database');
            }

            const [result] = await connection.execute(
                'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, difficulty_level, topic) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [examId, questionText, questionType, JSON.stringify(options), correctAnswer, difficultyLevel, topic]
            );

            if (!result || !result.insertId) {
                throw new Error('Error adding question');
            }

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
    } ,

    // AI Question Generation
    generateAIQuestions: async (req, res) => {
        let connection = null;
        try {
            const { examId, count = 5 } = req.body;

            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);

            if (!connection) {
                throw new Error('Could not connect to database');
            }

            // Check if exam exists and user is authorized
            const [exams] = await connection.execute(
                'SELECT * FROM exams WHERE exam_id = ? AND created_by = ?',
                [examId, req.user.id]
            );

            if (!exams || exams.length === 0) {
                throw new Error('Exam not found or unauthorized');
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

            if (!questions || questions.length === 0) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            // Calculate score
            let score = 0;
            const userAnswers = answers.map(answer => {
                const question = questions.find(q => q.question_id === answer.questionId);
                if (!question) {
                    return {
                        questionId: answer.questionId,
                        answer: answer.answer,
                        isCorrect: false
                    };
                }
                const isCorrect = question.correct_answer === answer.answer;
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

            if (!result || result.insertId === 0) {
                throw new Error('Error saving result');
            }

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
        let connection = null;
        try {
            const { userId } = req.params;
            const { examType, startDate, endDate } = req.query;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

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
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const [results] = await connection.execute(query, params);

            if (!results) {
                return res.status(404).json({ message: 'No performance data found' });
            }

            res.json({
                data: results,
                requestId: crypto.randomBytes(16).toString('hex')
            });
        } catch (error) {
            console.error('Get user performance error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message || 'An unexpected error occurred',
                requestId: crypto.randomBytes(16).toString('hex')
            });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    getBatchComparison: async (req, res) => {
        try {
            const { batchYear, examType } = req.query;

            if (!batchYear || !examType) {
                return res.status(400).json({ message: 'batchYear and examType are required' });
            }

            const comparison = await examModel.getBatchComparison(batchYear, examType);

            if (!comparison) {
                return res.status(404).json({ message: 'No batch comparison found' });
            }

            res.json(comparison);
        } catch (error) {
            console.error('Get batch comparison error:', error);
            res.status(500).json({ message: 'Error fetching batch comparison' });
        }
    },

    // Faculty Reports
    getFacultyPerformance: async (req, res) => {
        try {
            const { facultyId } = req.params;

            if (!facultyId) {
                return res.status(400).json({ message: 'facultyId is required' });
            }

            const performance = await examModel.getFacultyPerformance(facultyId);

            if (!performance) {
                return res.status(404).json({ message: 'No faculty performance found' });
            }

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
            if (!userId || !examId) {
                return res.status(400).json({ message: 'userId and examId are required' });
            }
            const performance = await examModel.getLSRWPerformance(userId, examId);
            if (!performance) {
                return res.status(404).json({ message: 'No LSRW performance found' });
            }
            res.json(performance);
        } catch (error) {
            console.error('Get LSRW performance error:', error);
            res.status(500).json({ message: 'Error fetching LSRW performance' });
        }
    },

    // Exam Success Analytics
    getExamSuccessMetrics: async (req, res) => {
        let connection = null;
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const metrics = await examModel.getExamSuccessMetrics(examId);

            if (!metrics) {
                return res.status(404).json({ message: 'No exam metrics found' });
            }

            res.json(metrics);
        } catch (error) {
            console.error('Get exam metrics error:', error);
            res.status(500).json({ message: 'Error fetching exam metrics', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Exam Scheduling
    rescheduleExam: async (req, res) => {
        try {
            const { examId, newDate } = req.body;
            if (!examId || !newDate) {
                return res.status(400).json({ message: 'Exam ID and new date are required' });
            }
            await examModel.rescheduleExam(examId, newDate);
            res.json({ message: 'Exam rescheduled successfully' });
        } catch (error) {
            if (error instanceof Error) {
                console.error('Reschedule exam error:', error.message, error.stack);
            } else {
                console.error('Reschedule exam error:', error);
            }
            res.status(500).json({ message: 'Error rescheduling exam', error: error?.message });
        }
    },

    // Retake Management
    checkRetakeEligibility: async (req, res) => {
        try {
            const { examId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const eligibility = await examModel.checkRetakeEligibility(userId, examId);
            if (!eligibility) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            const canRetake = eligibility?.attempt_count < eligibility?.max_retakes;
            res.json({
                canRetake,
                attemptsUsed: eligibility?.attempt_count ?? 0,
                maxRetakes: eligibility?.max_retakes ?? 0
            });
        } catch (error) {
            console.error('Check retake eligibility error:', error);
            res.status(500).json({ message: 'Error checking retake eligibility' });
        }
    },

    // Get Randomized Questions
    getExamQuestions: async (req, res) => {
        let connection;
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            const questions = await examModel.getRandomizedQuestions(examId);
            if (!questions || questions.length === 0) {
                return res.status(404).json({ message: 'No questions found for this exam' });
            }

            res.json(questions);
        } catch (error) {
            console.error('Get exam questions error:', error);
            res.status(500).json({ message: 'Error fetching exam questions', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // AI Question Suggestions
    getAISuggestedQuestions: async (req, res) => {
        try {
            const { topic } = req.query;
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            if (!topic) {
                return res.status(400).json({ message: 'Topic is required' });
            }

            const questions = await examModel.getAISuggestedQuestions(userId, topic);
            if (!questions) {
                return res.status(404).json({ message: 'No AI suggested questions found' });
            }

            res.json(questions);
        } catch (error) {
            console.error('Get AI questions error:', error);
            res.status(500).json({ message: 'Error fetching AI suggested questions', error: error.message });
        }
    },

    // List all exams created by a college admin
    getAllExams: async (req, res) => {
        let connection = null;
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);

            if (!connection) {
                throw new Error('Error connecting to database');
            }

            const [exams] = await connection.execute(
                'SELECT * FROM exams WHERE created_by = ? ORDER BY created_at DESC',
                [userId]
            );

            if (!exams || exams.length === 0) {
                return res.status(404).json({ message: 'No exams found' });
            }

            res.json(exams);
        } catch (error) {
            console.error('Get all exams error:', error);
            res.status(500).json({ message: 'Error fetching exams', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Get exams with filtering
    getAllExams: async (req, res) => {
        const { type, category, topic, companyName } = req.query;
        let query = 'SELECT * FROM exams WHERE 1=1';
        const params = [];
        if (type) { query += ' AND type = ?'; params.push(type); }
        if (category) { query += ' AND category = ?'; params.push(category); }
        if (topic) { query += ' AND topic = ?'; params.push(topic); }
        if (companyName) { query += ' AND companyName = ?'; params.push(companyName); }

        let connection = null;
        try {
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Error connecting to database');
            }
            
            const [exams] = await connection.execute(query, params);
            if (!exams) {
                throw new Error('Error fetching exams');
            }

            res.json({ exams });
        } catch (error) {
            console.error('Error fetching exams:', error);
            res.status(500).json({ message: 'Error fetching exams', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Fetch full details of one exam
    getExamById: async (req, res) => {
        let connection = null;
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Error connecting to database');
            }

            const [exams] = await connection.execute(
                'SELECT * FROM exams WHERE exam_id = ?',
                [examId]
            );

            if (!exams || exams.length === 0) {
                throw new Error('Exam not found');
            }

            const exam = exams[0];
            if (!exam) {
                throw new Error('Exam not found');
            }

            res.json(exam);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Get exam by ID error:', error.message, error.stack);
            } else {
                console.error('Get exam by ID error:', error);
            }
            res.status(500).json({ message: 'Error fetching exam', error: error?.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Update the exam’s details
    updateExam: async (req, res) => {
        let connection;
        try {
            const { examId } = req.params;
            const { title, description, duration, totalMarks } = req.body;

            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            if (!title && !description && !duration && !totalMarks) {
                return res.status(400).json({ message: 'No fields to update' });
            }

            connection = await mysql.createConnection(dbConfig);

            const fields = [];
            const values = [];
            if (title) { fields.push('exam_name = ?'); values.push(title); }
            if (description) { fields.push('description = ?'); values.push(description); }
            if (duration) { fields.push('duration = ?'); values.push(duration); }
            if (totalMarks) { fields.push('total_questions = ?'); values.push(totalMarks); }

            values.push(examId);

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            const [result] = await connection.execute(
                `UPDATE exams SET ${fields.join(', ')} WHERE exam_id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                throw new Error('Exam not found or no changes made');
            }

            await connection.end();
            res.json({ message: 'Exam updated successfully' });
        } catch (error) {
            console.error('Update exam error:', error);
            res.status(500).json({ message: 'Error updating exam', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Delete an exam
    deleteExam: async (req, res) => {
        let connection = null;
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Error connecting to database');
            }

            const [result] = await connection.execute(
                'DELETE FROM exams WHERE exam_id = ?',
                [examId]
            );

            if (!result || result.affectedRows === 0) {
                return res.status(404).json({ message: 'Exam not found' });
            }

            res.json({ message: 'Exam deleted successfully' });
        } catch (error) {
            console.error('Delete exam error:', error);
            res.status(500).json({ message: 'Error deleting exam', error: error?.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },

    // Assign a specific exam to selected students or entire college
    assignExamToStudents: async (req, res) => {
        let connection = null;
        try {
            const { examId, studentIds } = req.body; // studentIds: array of user IDs
            if (!examId || !Array.isArray(studentIds) || studentIds.length === 0) {
                return res.status(400).json({ message: 'Exam ID and student IDs are required' });
            }
            if (!studentIds.every(id => typeof id === 'number')) {
                throw new Error('Student IDs must be an array of numbers');
            }

            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            for (const userId of studentIds) {
                if (typeof userId !== 'number') {
                    throw new Error(`Student ID is not a number: ${userId}`);
                }
                await connection.execute(
                    'INSERT IGNORE INTO assigned_exams (user_id, exam_id) VALUES (?, ?)',
                    [userId, examId]
                );
            }

            res.json({ message: 'Exam assigned to students successfully' });
        } catch (error) {
            console.error('Assign exam to students error:', error);
            res.status(500).json({ message: 'Error assigning exam to students', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },
    // Bulk upload questions via CSV or form
    uploadQuestions: async (req, res) => {
        let connection = null;
        try {
            const { examId, questions } = req.body;
            if (!examId || !Array.isArray(questions) || questions.length === 0) {
                return res.status(400).json({ message: 'Exam ID and questions are required' });
            }
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            for (const q of questions) {
                if (!q || typeof q !== 'object') {
                    throw new Error('Invalid question format: question is not an object');
                }
                if (!q.questionText || typeof q.questionText !== 'string') {
                    throw new Error('Invalid question format: questionText is not a string');
                }
                if (!q.questionType || typeof q.questionType !== 'string') {
                    throw new Error('Invalid question format: questionType is not a string');
                }
                if (!Array.isArray(q.options) || q.options.length === 0) {
                    throw new Error('Invalid question format: options is not an array or is empty');
                }
                if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
                    throw new Error('Invalid question format: correctAnswer is not a string');
                }
                if (!q.difficultyLevel || typeof q.difficultyLevel !== 'string') {
                    throw new Error('Invalid question format: difficultyLevel is not a string');
                }
                if (!q.topic || typeof q.topic !== 'string') {
                    throw new Error('Invalid question format: topic is not a string');
                }
                await connection.execute(
                    'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, difficulty_level, topic) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [examId, q.questionText, q.questionType, JSON.stringify(q.options), q.correctAnswer, q.difficultyLevel, q.topic]
                );
            }
            await connection.end();
            res.json({ message: 'Questions uploaded successfully' });
        } catch (error) {
            console.error('Upload questions error:', error);
            res.status(500).json({ message: 'Error uploading questions', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },
    // List all questions for an exam
    getQuestionsByExamId: async (req, res) => {
        let connection = null;
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'examId is required' });
            }
            connection = await mysql.createConnection(dbConfig);
            const [questions] = await connection.execute(
                'SELECT * FROM questions WHERE exam_id = ?',
                [examId]
            );
            if (!questions || questions.length === 0) {
                return res.status(404).json({ message: 'No questions found for this exam' });
            }
            res.json(questions);
        } catch (error) {
            console.error('Get questions by exam ID error:', error);
            res.status(500).json({ message: 'Error fetching questions by exam ID', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },
    // Edit a question
    updateQuestion: async (req, res) => {
        let connection;
        try {
            const { questionId } = req.params;
            if (!questionId) {
                return res.status(400).json({ message: 'Question ID is required' });
            }

            const { questionText, questionType, options, correctAnswer, difficultyLevel, topic } = req.body;
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }

            // Build dynamic update query
            const fields = [];
            const values = [];
            if (questionText) { fields.push('question_text = ?'); values.push(questionText); }
            if (questionType) { fields.push('question_type = ?'); values.push(questionType); }
            if (options) { fields.push('options = ?'); values.push(JSON.stringify(options)); }
            if (correctAnswer) { fields.push('correct_answer = ?'); values.push(correctAnswer); }
            if (difficultyLevel) { fields.push('difficulty_level = ?'); values.push(difficultyLevel); }
            if (topic) { fields.push('topic = ?'); values.push(topic); }

            if (fields.length === 0) {
                await connection.end();
                return res.status(400).json({ message: 'No fields to update' });
            }

            values.push(questionId);

            const [result] = await connection.execute(
                `UPDATE questions SET ${fields.join(', ')} WHERE question_id = ?`,
                values
            );
            if (!result || result.affectedRows === 0) {
                throw new Error('Failed to execute update query');
            }
            
            res.json({ message: 'Question updated successfully' });
        } catch (error) {
            console.error('Update question error:', error);
            res.status(500).json({ message: 'Error updating question', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },
    // Delete a question
    deleteQuestion: async (req, res) => {
        let connection = null;
        try {
            const { questionId } = req.params;
            if (!questionId) {
                return res.status(400).json({ message: 'Question ID is required' });
            }
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            const [result] = await connection.execute(
                'DELETE FROM questions WHERE question_id = ?',
                [questionId]
            );
            if (!result || result.affectedRows === 0) {
                throw new Error('Question not found');
            }
            if (result && result.affectedRows > 0) {
                res.json({ message: 'Question deleted successfully' });
            } else {
                throw new Error('Error deleting question');
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('Delete question error:', error);
                res.status(500).json({ message: 'Error deleting question', error: error.message });
            } else {
                console.error('Delete question error:', error);
                res.status(500).json({ message: 'Error deleting question', error: 'Internal Server Error' });
            }
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    if (endError instanceof Error) {
                        console.error('Error closing connection:', endError);
                    } else {
                        console.error('Error closing connection:', 'Internal Server Error');
                    }
                }
            }
        }
    },
    // Analyze exam results: avg, top scorer, low score
    analyzeExamResults: async (req, res) => {
        let connection;
        try {
            const { examId } = req.params;
            if (!examId) {
                return res.status(400).json({ message: 'Exam ID is required' });
            }
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            const [stats] = await connection.execute(
                `SELECT 
                    AVG(score) AS averageScore,
                    MAX(score) AS topScore,
                    MIN(score) AS lowScore
                FROM user_results
                WHERE exam_id = ?`,
                [examId]
            );
            if (!stats || !stats[0] || !stats[0].averageScore || !stats[0].topScore || !stats[0].lowScore) {
                throw new Error('No stats found');
            }
            await connection.end();
            res.json(stats[0]);
        } catch (error) {
            if (error instanceof Error) {
                console.error('Analyze exam results error:', error);
                res.status(500).json({ message: 'Error analyzing exam results', error: error.message });
            } else {
                console.error('Analyze exam results error:', error);
                res.status(500).json({ message: 'Error analyzing exam results', error: 'Internal Server Error' });
            }
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    if (endError instanceof Error) {
                        console.error('Error closing connection:', endError);
                    } else {
                        console.error('Error closing connection:', 'Internal Server Error');
                    }
                }
            }
        }
    },

    // Show assigned exams for a student
    getAssignedExamsForStudent: async (req, res) => {
        let connection = null;
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(400).json({ message: 'User ID is required' });
            }
            connection = await mysql.createConnection(dbConfig);
            const [exams] = await connection.execute(
                `SELECT e.exam_id, e.exam_name, e.duration, e.total_questions, e.created_at
                 FROM assigned_exams ae
                 JOIN exams e ON ae.exam_id = e.exam_id
                 WHERE ae.user_id = ?
                 ORDER BY e.created_at DESC`,
                [userId]
            );
            if (!exams || exams.length === 0) {
                return res.status(404).json({ message: 'No assigned exams found' });
            }
            res.json(exams);
        } catch (error) {
            console.error('Get assigned exams for student error:', error);
            res.status(500).json({ message: 'Error fetching assigned exams for student', error: error.message });
        } finally {
            if (connection) {
                try {
                    await connection.end();
                } catch (endError) {
                    console.error('Error closing connection:', endError);
                }
            }
        }
    },
    // Tag questions with topic, difficulty (AI generated)
    tagQuestionAI: async (req, res) => {
        try {
            const { questionText } = req.body;
            if (!questionText) {
                return res.status(400).json({ message: 'questionText is required' });
            }
            const prompt = `Analyze the following question and suggest a topic and difficulty level (easy, medium, hard):\n\n"${questionText}"\n\nRespond in JSON: {"topic": "...", "difficulty": "..."}`;
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response || !response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
                throw new Error('Invalid response structure from OpenAI');
            }
            // Try to parse the AI's JSON response
            let aiTag = {};
            try {
                aiTag = JSON.parse(response.data.choices[0].message.content);
                if (!aiTag || !aiTag.topic || !aiTag.difficulty) {
                    throw new Error('Invalid AI response structure');
                }
            } catch (parseError) {
                aiTag = { raw: response.data.choices[0].message.content };
                console.error('Error parsing AI response:', parseError);
                return res.status(400).json({ message: 'Invalid AI response structure' });
            }
            res.json({ tag: aiTag });
        } catch (error) {
            if (error instanceof Error) {
                console.error('AI tagQuestion error:', error);
                res.status(500).json({ message: 'AI tagging failed', error: error.message });
            } else {
                console.error('AI tagQuestion error:', error);
                res.status(500).json({ message: 'AI tagging failed', error: 'Internal Server Error' });
            }
        }
    },

    // Auto-create exam based on topic (using your AI generator)
    generateExamFromTopic: async (req, res) => {
        try {
            const { topic, count = 5, difficulty = 'medium' } = req.body;
            if (!topic) {
                return res.status(400).json({ message: 'topic is required' });
            }
            
            const prompt = `Generate ${count} ${difficulty} level multiple-choice questions on the topic "${topic}". For each question, provide 4 options and indicate the correct answer. Respond in JSON array format: [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "A"}]`;
            
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response || !response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
                throw new Error('Invalid response structure from OpenAI');
            }

            let questions = [];
            try {
                questions = JSON.parse(response.data.choices[0].message.content);
                if (!Array.isArray(questions)) {
                    throw new Error('Parsed questions is not an array');
                }
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                return res.status(500).json({ message: 'Failed to parse AI response', error: parseError.message });
            }
            
            res.json({ questions });
        } catch (error) {
            console.error('AI generateExamFromTopic error:', error);
            res.status(500).json({ message: 'AI exam generation failed', error: error.message });
        }
    },

    // Handle timed mock exams only (not for practice mode)
    setExamTimer: async (req, res) => {
        // Timer is usually enforced on the frontend, but you can store/retrieve timer info here
        const { examId, timer } = req.body;
        if (!examId || !timer) {
            return res.status(400).json({ message: 'examId and timer are required' });
        }
        let connection = null;
        try {
            connection = await mysql.createConnection(dbConfig);
            if (!connection) {
                throw new Error('Database connection failed');
            }
            if (!connection || typeof connection.execute !== 'function') {
                throw new Error('Connection is invalid or does not have execute method');
            }
            await connection.execute(
                'UPDATE exams SET duration = ? WHERE exam_id = ?',
                [timer, examId]
            );
            await connection.end();
            res.json({ message: 'Exam timer updated successfully' });
        } catch (error) {
            if (error instanceof Error) {
                console.error('Set exam timer error:', error.message, error.stack);
            } else {
                console.error('Set exam timer error:', error);
            }
            res.status(500).json({ message: 'Error setting exam timer', error: error?.message });
        } finally {
            if (connection) {
                try {
                    if (typeof connection.end === 'function') {
                        await connection.end();
                    }
                } catch (endError) {
                    if (endError instanceof Error) {
                        console.error('Error closing connection:', endError.message, endError.stack);
                    } else {
                        console.error('Error closing connection:', endError);
                    }
                }
            }
        }
    },

    // Show correct vs wrong with explanation (practice mode)
    reviewIncorrectAnswers: async (req, res) => {
        try {
            const { examId, answers } = req.body;
            if (!examId || !Array.isArray(answers) || answers.length === 0) {
                return res.status(400).json({ message: 'examId and answers are required' });
            }
            let connection = null;
            try {
                connection = await mysql.createConnection(dbConfig);
                const [questions] = await connection.execute(
                    'SELECT question_id, question_text, correct_answer, explanation FROM questions WHERE exam_id = ?',
                    [examId]
                );
                if (!questions || !Array.isArray(questions)) {
                    throw new Error('Invalid response from database');
                }
                await connection.end();

                const review = answers.map(ans => {
                    const q = questions.find(q => q.question_id === ans.questionId);
                    if (!q) {
                        throw new Error(`Question ${ans.questionId} not found`);
                    }
                    const questionText = q.question_text;
                    const yourAnswer = ans.answer;
                    const correctAnswer = q.correct_answer;
                    const isCorrect = q.correct_answer === ans.answer;
                    const explanation = q.explanation;

                    return {
                        questionId: ans.questionId,
                        questionText,
                        yourAnswer,
                        correctAnswer,
                        isCorrect,
                        explanation
                    };
                });

                res.json({ review });
            } catch (error) {
                console.error('Review incorrect answers error:', error);
                res.status(500).json({ message: 'Error reviewing answers', error: error.message });
            } finally {
                if (connection) {
                    try {
                        await connection.end();
                    } catch (endError) {
                        console.error('Error closing connection:', endError);
                    }
                }
            }
        } catch (error) {
            console.error('Error in reviewIncorrectAnswers outer try-catch:', error);
            res.status(500).json({ message: 'Error reviewing answers', error: error.message });
        }
    }
};