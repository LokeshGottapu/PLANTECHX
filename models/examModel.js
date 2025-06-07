const { query } = require('../model');

// Initialize OpenAI client if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}

module.exports = {
    // Exam Management
    createExam: async (examData) => {
        try {
            const sql = 'INSERT INTO exams (exam_name, exam_type, total_questions, duration, exam_date, retake_policy, max_retakes, time_limit, shuffle_questions, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
            const result = await query(sql, [
                examData.examName,
                examData.examType,
                examData.totalQuestions,
                examData.duration,
                examData.examDate,
                examData.retakePolicy,
                examData.maxRetakes,
                examData.timeLimit,
                examData.shuffleQuestions,
                examData.createdBy
            ]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to create exam');
        }
    },

    // Question Management
    addQuestion: async (questionData) => {
        try {
            const sql = 'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, difficulty_level, topic, ai_generated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const result = await query(sql, [
                questionData.examId,
                questionData.questionText,
                questionData.questionType,
                JSON.stringify(questionData.options),
                questionData.correctAnswer,
                questionData.difficultyLevel,
                questionData.topic,
                questionData.aiGenerated
            ]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to add question');
        }
    },

    // User Results
    recordUserResult: async (resultData) => {
        try {
            const sql = 'INSERT INTO user_results (user_id, exam_id, score, completion_time, answers, completed_at) VALUES (?, ?, ?, ?, ?, NOW())';
            const result = await query(sql, [
                resultData.userId,
                resultData.examId,
                resultData.score,
                resultData.completionTime,
                JSON.stringify(resultData.answers)
            ]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to record user result');
        }
    },

    // Analytics
    // Student Performance Analytics
    getUserPerformance: async (userId, filters = {}) => {
        try {
            let sql = `
                SELECT 
                    e.exam_name,
                    e.exam_type,
                    ur.score,
                    ur.completion_time,
                    ur.completed_at
                FROM user_results ur
                JOIN exams e ON ur.exam_id = e.exam_id
                WHERE ur.user_id = ?
            `;
            const values = [userId];

            if (filters.examType) {
                sql += ' AND e.exam_type = ?';
                values.push(filters.examType);
            }

            if (filters.startDate && filters.endDate) {
                sql += ' AND ur.completed_at BETWEEN ? AND ?';
                values.push(filters.startDate, filters.endDate);
            }

            sql += ' ORDER BY ur.completed_at DESC';

            const result = await query(sql, values);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch user performance');
        }
    },

    getBatchComparison: async (batchYear, examType) => {
        try {
            const sql = `
                SELECT 
                    u.batch_year,
                    e.exam_name,
                    COUNT(DISTINCT ur.user_id) as total_students,
                    AVG(ur.score) as average_score,
                    COUNT(CASE WHEN ur.score >= 75 THEN 1 END) as high_performers
                FROM user_results ur
                JOIN exams e ON ur.exam_id = e.exam_id
                JOIN users u ON ur.user_id = u.user_id
                WHERE u.batch_year = ? AND e.exam_type = ?
                GROUP BY e.exam_id
                ORDER BY e.exam_date DESC
            `;
            return await query(sql, [batchYear, examType]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch batch comparison');
        }
    },

    // Faculty Analytics
    getFacultyPerformance: async (facultyId, filters = {}) => {
        try {
            const sql = `
                SELECT 
                    f.faculty_id,
                    COUNT(DISTINCT e.exam_id) as exams_created,
                    COUNT(DISTINCT q.question_id) as questions_contributed,
                    COUNT(DISTINCT ur.user_id) as students_assessed
                FROM faculty f
                LEFT JOIN exams e ON f.faculty_id = e.created_by
                LEFT JOIN questions q ON f.faculty_id = q.created_by
                LEFT JOIN user_results ur ON e.exam_id = ur.exam_id
                WHERE f.faculty_id = ?
                GROUP BY f.faculty_id
            `;
            return await query(sql, [facultyId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch faculty performance');
        }
    },

    // LSRW Analytics
    getLSRWPerformance: async (userId, examId) => {
        try {
            const sql = `
                SELECT 
                    ls.skill_type,
                    AVG(ls.score) as average_score,
                    COUNT(ls.assessment_id) as total_assessments
                FROM lsrw_scores ls
                WHERE ls.user_id = ? AND ls.exam_id = ?
                GROUP BY ls.skill_type
            `;
            return await query(sql, [userId, examId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch LSRW performance');
        }
    },

    // Exam Success Analytics
    getExamSuccessMetrics: async (examId) => {
        try {
            const sql = `
                SELECT 
                    COUNT(DISTINCT ur.user_id) as total_participants,
                    AVG(ur.score) as average_score,
                    COUNT(CASE WHEN ur.score >= 75 THEN 1 END) as passing_count,
                    MAX(ur.score) as highest_score,
                    MIN(ur.completion_time) as best_completion_time
                FROM user_results ur
                WHERE ur.exam_id = ?
            `;
            return await query(sql, [examId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to fetch exam success metrics');
        }
    },

    // Exam Scheduling
    rescheduleExam: async (examId, newDate) => {
        try {
            const sql = 'UPDATE exams SET exam_date = ? WHERE exam_id = ?';
            return await query(sql, [newDate, examId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to reschedule exam');
        }
    },

    // Retake Management
    checkRetakeEligibility: async (userId, examId) => {
        try {
            const sql = `
                SELECT 
                    e.max_retakes,
                    COUNT(ur.result_id) as attempt_count
                FROM exams e
                LEFT JOIN user_results ur ON e.exam_id = ur.exam_id AND ur.user_id = ?
                WHERE e.exam_id = ?
                GROUP BY e.exam_id`;
            const [result] = await query(sql, [userId, examId]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to check retake eligibility');
        }
    },

    // Question Randomization
    getRandomizedQuestions: async (examId) => {
        try {
            const sql = 'SELECT * FROM questions WHERE exam_id = ? ORDER BY RAND()';
            return await query(sql, [examId]);
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to randomize questions');
        }
    },

    // AI Question Generation
    generateAIQuestions: async (topic, count) => {
        try {
            const prompt = `Generate ${count} multiple choice questions about ${topic}. Format each question with 4 options and indicate the correct answer.`;
            
            const completion = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: prompt,
                max_tokens: 1000,
                temperature: 0.7,
            });

            // Process and format AI generated questions
            const generatedQuestions = completion.data.choices[0].text;
            // TODO: Parse and format the generated questions
            return generatedQuestions;
        } catch (err) {
            console.error('AI Question Generation error:', err);
            throw new Error('Failed to generate AI questions');
        }
    },

    // AI Question Suggestions
    getAISuggestedQuestions: async (userId, topic) => {
        try {
            const sql = `
                SELECT q.*
                FROM questions q
                LEFT JOIN user_results ur ON q.exam_id = ur.exam_id
                WHERE q.topic = ? 
                AND (ur.user_id != ? OR ur.user_id IS NULL)
                AND q.ai_generated = true
                ORDER BY q.difficulty_level
                LIMIT 10
            `;
            const result = await query(sql, [topic, userId]);
            return result;
        } catch (err) {
            console.error('Database error:', err);
            throw new Error('Failed to get AI suggested questions');
        }
    }
};