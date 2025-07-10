// Result Controller

const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const PDFDocument = require('pdfkit');

const getResults = async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [results] = await connection.execute(
            'SELECT r.*, u.name as userName, e.name as examName FROM exam_results r JOIN users u ON r.userId = u.id JOIN exams e ON r.examId = e.id ORDER BY r.submittedAt DESC'
        );
        await connection.end();
        if (!results || !Array.isArray(results) || results.length === 0) {
            return res.status(404).json({ message: 'No results found' });
        }
        res.json({ results });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

const getResultById = async (req, res) => {
    const { resultId } = req.params;
    if (!resultId) {
        return res.status(400).json({ message: 'Result ID is required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [results] = await connection.execute(
            'SELECT r.*, u.name as userName, e.name as examName FROM exam_results r JOIN users u ON r.userId = u.id JOIN exams e ON r.examId = e.id WHERE r.id = ?',
            [resultId]
        );
        if (!results || !Array.isArray(results) || results.length === 0) {
            throw new Error('Result not found');
        }
        const result = results[0];
        if (!result) {
            throw new Error('Result not found');
        }
        await connection.end();
        res.json({ result });
    } catch (error) {
        console.error('Get result by ID error:', error);
        res.status(500).json({ message: 'Error fetching result', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

const createResult = async (req, res) => {
    const { userId, examId, marks } = req.body;

    if (!userId || userId === null || userId === undefined || !examId || examId === null || examId === undefined || marks === undefined || marks === null) {
        return res.status(400).json({ message: 'User ID, Exam ID, and marks are required' });
    }

    try {
        const result = await Result.create({ userId, examId, marks });

        if (!result || !result.dataValues) {
            throw new Error('Failed to create result');
        }

        res.status(201).json({ message: 'Result created successfully', result: result.dataValues });
    } catch (error) {
        console.error('Create result error:', error);
        res.status(500).json({ message: 'Error creating result', error: error.message });
    }
};

// Get a student's results
const getResultsByStudent = async (req, res) => {
    const { studentId } = req.params;
    if (!studentId || studentId === null || studentId === undefined) {
        return res.status(400).json({ message: 'Student ID is required' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }

        const [results] = await connection.execute(
            'SELECT r.*, e.name as examName, e.type, e.category FROM exam_results r JOIN exams e ON r.examId = e.id WHERE r.userId = ? ORDER BY r.submittedAt DESC',
            [studentId]
        );

        if (!results || results.length === 0) {
            throw new Error('No results found for student');
        }

        await connection.end();
        res.json({ results });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Get results by student error:', error);
            res.status(500).json({ message: 'Error fetching student results', error: error.message });
        } else {
            console.error('Get results by student error:', error);
            res.status(500).json({ message: 'Error fetching student results', error: 'Internal Server Error' });
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
};

// Get all results for an exam
const getResultsByExam = async (req, res) => {
    const { examId } = req.params;
    if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Error connecting to database');
        }

        const [results] = await connection.execute(
            'SELECT r.*, u.name as userName FROM exam_results r JOIN users u ON r.userId = u.id WHERE r.examId = ? ORDER BY r.submittedAt DESC',
            [examId]
        );

        if (!results || results.length === 0) {
            throw new Error('No results found for exam');
        }

        await connection.end();
        res.json({ results });
    } catch (error) {
        console.error('Get results by exam error:', error);
        res.status(500).json({ message: 'Error fetching exam results', error: error.message });
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
};

// Submit answers and auto-calculate score
exports.submitResult = async (req, res) => {
    const { userId, examId, answers, startTime, endTime } = req.body;
    if (!userId || !examId || !answers) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Fetch exam questions and correct answers
        const [exams] = await connection.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        if (!exams.length) return res.status(404).json({ message: 'Exam not found' });
        const exam = exams[0];
        if (!exam) {
            throw new Error('Exam not found');
        }
        const questions = JSON.parse(exam.questions);
        if (!questions || !Array.isArray(questions)) {
            throw new Error('Invalid questions');
        }
        // Auto-score
        let score = 0;
        let feedback = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const userAns = answers[i];
            const correct = userAns === q.correctOption;
            if (correct) score++;
            feedback.push({
                question: q.question,
                userAnswer: userAns,
                correctAnswer: q.correctOption,
                isCorrect: correct,
                explanation: q.explanation || ''
            });
        }
        // Timer logic
        let timeSpent = null;
        if (startTime && endTime) {
            timeSpent = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
        }
        // Store result
        await connection.execute(
            'INSERT INTO exam_results (userId, examId, answers, score, timeSpent) VALUES (?, ?, ?, ?, ?)', [userId, examId, JSON.stringify(answers), score, timeSpent]
        );
        await connection.end();
        res.json({ message: 'Result submitted', score, feedback });
    } catch (error) {
        console.error('Error submitting result:', error);
        res.status(500).json({ message: 'Error submitting result', error: error.message });
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
};

// Submit result (supports offline)
const submitResult = async (req, res) => {
    const { userId, examId, marks, isOffline, syncedAt } = req.body;
    if (!userId || !examId || marks === undefined || marks === null) {
        return res.status(400).json({ message: 'User ID, Exam ID, and marks are required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        await connection.execute(
            'INSERT INTO exam_results (userId, examId, marks, is_offline, synced_at, submittedAt) VALUES (?, ?, ?, ?, ?, NOW())',
            [userId, examId, marks, isOffline ? 1 : 0, syncedAt || null]
        );
        await connection.end();
        res.status(201).json({ message: 'Result submitted', isOffline: !!isOffline });
    } catch (error) {
        console.error('Submit result error:', error);
        res.status(500).json({ message: 'Error submitting result', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Get exam history for user
exports.getHistory = async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [results] = await connection.execute(
            'SELECT r.*, e.name as examName, e.type, e.category FROM exam_results r JOIN exams e ON r.examId = e.id WHERE r.userId = ? ORDER BY r.submittedAt DESC',
            [userId]
        );
        if (!results || results.length === 0) {
            throw new Error('No history found for user');
        }
        await connection.end();
        res.json({ history: results });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// SWOT report
exports.getSwotReport = async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [results] = await connection.execute(
            'SELECT e.category, r.score FROM exam_results r JOIN exams e ON r.examId = e.id WHERE r.userId = ? ORDER BY r.submittedAt DESC LIMIT 5',
            [userId]
        );
        await connection.end();
        if (!results || results.length === 0) {
            throw new Error('No history found for user');
        }
        // Analyze
        const swot = {};
        results.forEach(r => {
            if (!swot[r.category]) swot[r.category] = [];
            if (r.score === null || r.score === undefined) {
                throw new Error('Invalid score');
            }
            swot[r.category].push(r.score);
        });
        const report = Object.entries(swot).map(([cat, scores]) => {
            if (!scores || scores.length === 0) {
                throw new Error('No scores found');
            }
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            let status = 'Neutral';
            if (avg >= 70) status = 'Strength';
            else if (avg <= 40) status = 'Weakness';
            return { category: cat, avg, status };
        });
        res.json({ swot: report });
    } catch (error) {
        console.error('Get SWOT report error:', error);
        res.status(500).json({ message: 'Error generating SWOT', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

// Downloadable PDF result
exports.getResultPdf = async (req, res) => {
    const { resultId } = req.params;
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [results] = await connection.execute(
            'SELECT r.*, u.name as userName, e.name as examName FROM exam_results r JOIN users u ON r.userId = u.id JOIN exams e ON r.examId = e.id WHERE r.id = ?',
            [resultId]
        );
        if (!results || results.length === 0) {
            throw new Error('Result not found');
        }
        const result = results[0];
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=result_${resultId}.pdf`);
        doc.pipe(res);
        doc.text(`User: ${result.userName ?? 'N/A'}`);
        doc.text(`Exam: ${result.examName ?? 'N/A'}`);
        doc.text(`Score: ${result.score ?? 'N/A'}`);
        doc.text(`Submitted: ${result.submittedAt ?? 'N/A'}`);
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

module.exports = {
    getResults,
    getResultById,
    createResult,
    getResultsByStudent,
    getResultsByExam,
    submitResult
};