const examModel = require('../models/examModel');
const { validationResult } = require('express-validator');

module.exports = {
    // Exam Management
    createExam: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { 
                examName, 
                examType, 
                totalQuestions, 
                duration,
                examDate,
                retakePolicy,
                maxRetakes,
                timeLimit,
                shuffleQuestions
            } = req.body;

            const result = await examModel.createExam({
                examName,
                examType,
                totalQuestions,
                duration,
                examDate,
                retakePolicy,
                maxRetakes,
                timeLimit,
                shuffleQuestions,
                createdBy: req.user.userId
            });
            res.status(201).json({
                message: 'Exam created successfully',
                examId: result.insertId
            });
        } catch (error) {
            console.error('Create exam error:', error);
            res.status(500).json({ message: 'Error creating exam' });
        }
    },

    // Question Management
    addQuestion: async (req, res) => {
        try {
            const { examId, questionText, questionType, options, correctAnswer, difficultyLevel, topic } = req.body;
            const result = await examModel.addQuestion({
                examId,
                questionText,
                questionType,
                options,
                correctAnswer,
                difficultyLevel,
                topic,
                aiGenerated: false
            });
            res.status(201).json({
                message: 'Question added successfully',
                questionId: result.insertId
            });
        } catch (error) {
            console.error('Add question error:', error);
            res.status(500).json({ message: 'Error adding question' });
        }
    },

    // Take Exam
    submitExam: async (req, res) => {
        try {
            const { examId, answers, completionTime } = req.body;
            const userId = req.user.userId;

            // Calculate score based on answers
            const score = await calculateScore(examId, answers);

            const result = await examModel.recordUserResult({
                userId,
                examId,
                score,
                completionTime,
                answers
            });

            res.json({
                message: 'Exam submitted successfully',
                score,
                resultId: result.insertId
            });
        } catch (error) {
            console.error('Submit exam error:', error);
            res.status(500).json({ message: 'Error submitting exam' });
        }
    },

    // Performance Analytics
    // Student Performance Reports
    getUserPerformance: async (req, res) => {
        try {
            const userId = req.params.userId || req.user.userId;
            const { examType, startDate, endDate } = req.query;
            
            const performance = await examModel.getUserPerformance(userId, {
                examType,
                startDate,
                endDate
            });
            
            res.json(performance);
        } catch (error) {
            console.error('Get performance error:', error);
            res.status(500).json({ message: 'Error fetching user performance' });
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
            const { topic, count } = req.body;
            const questions = await examModel.generateAIQuestions(topic, count);
            res.json(questions);
        } catch (error) {
            console.error('AI question generation error:', error);
            res.status(500).json({ message: 'Error generating AI questions' });
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