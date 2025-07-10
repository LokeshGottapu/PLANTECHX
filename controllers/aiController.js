// AI Controller

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Generate AI-based questions using OpenAI
const generateQuestions = async (req, res) => {
    const { topic, level } = req.body;
    if (!topic) {
        return res.status(400).json({ message: 'Topic is required' });
    }

    try {
        const prompt = `Generate 5 ${level || 'medium'} level multiple-choice questions on the topic: ${topic}. Provide options and the correct answer.`;
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

        const aiText = response.data.choices[0].message.content;
        if (!aiText) {
            throw new Error('AI returned empty response');
        }
        res.json({ questions: aiText });
    } catch (error) {
        console.error('AI question generation error:', error);
        res.status(500).json({ message: 'AI question generation failed', error: error.message });
    }
};

// Analyze essay using OpenAI
const analyzeEssay = async (req, res) => {
    const { essay } = req.body;
    if (!essay) return res.status(400).json({ message: 'Essay is required' });

    try {
        const prompt = `Grade the following essay and provide feedback:\n\n${essay}`;
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

        const feedback = response.data.choices[0].message.content;
        if (!feedback) {
            throw new Error('AI returned empty response');
        }
        res.json({ feedback });
    } catch (error) {
        console.error('Essay analysis error:', error);
        res.status(500).json({ message: 'Essay analysis failed', error: error.message });
    }
};

// Simple SWOT analysis based on user input
const swotAnalysis = async (req, res) => {
    try {
        const { strengths, weaknesses, opportunities, threats } = req.body;

        if (!strengths || !weaknesses || !opportunities || !threats) {
            return res.status(400).json({ message: 'All SWOT fields are required' });
        }

        if (typeof strengths !== 'string' || typeof weaknesses !== 'string' || typeof opportunities !== 'string' || typeof threats !== 'string') {
            return res.status(400).json({ message: 'All SWOT fields must be strings' });
        }

        if (strengths.trim() === '' || weaknesses.trim() === '' || opportunities.trim() === '' || threats.trim() === '') {
            return res.status(400).json({ message: 'All SWOT fields must contain non-whitespace characters' });
        }

        // You can enhance this with AI if needed
        res.json({
            SWOT: {
                strengths: strengths.trim(),
                weaknesses: weaknesses.trim(),
                opportunities: opportunities.trim(),
                threats: threats.trim()
            }
        });
    } catch (error) {
        console.error('SWOT analysis error:', error);
        res.status(500).json({ message: 'SWOT analysis failed', error: error.message });
    }
};

// Get LSRW & SWOT results history for a user
const getLsrwSwotResultsHistory = async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [lsrwResults] = await connection.execute(
            'SELECT * FROM lsrw_results WHERE userId = ? ORDER BY submittedAt DESC',
            [userId]
        );
        const [swotResults] = await connection.execute(
            'SELECT * FROM swot_feedback WHERE userId = ? ORDER BY createdAt DESC',
            [userId]
        );
        await connection.end();

        res.json({ lsrwResults, swotResults });
    } catch (error) {
        console.error('Error fetching LSRW & SWOT results history:', error);
        res.status(500).json({ message: 'Error fetching LSRW & SWOT results history', error: error.message });
    }
};

// Store SWOT feedback report
const storeSwotFeedback = async (req, res) => {
    const { userId, report } = req.body;

    if (!userId || userId === null || userId === undefined) {
        return res.status(400).json({ message: 'userId is required and must not be null or undefined' });
    }

    if (!report || report === null || report === undefined) {
        return res.status(400).json({ message: 'report is required and must not be null or undefined' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        const [rows] = await connection.execute(
            'INSERT INTO swot_feedback (userId, report, createdAt) VALUES (?, ?, NOW())',
            [userId, report]
        );

        if (!rows || rows.affectedRows !== 1) {
            throw new Error('Error saving SWOT feedback');
        }

        await connection.end();

        res.json({ message: 'SWOT feedback stored', userId, report });
    } catch (error) {
        console.error('Error storing SWOT feedback:', error);
        res.status(500).json({ message: 'Error storing SWOT feedback', error: error.message });
    }
};

// Get SWOT feedback report
const getSwotFeedback = async (req, res) => {
    const { userId } = req.params;
    if (!userId || userId === null || userId === undefined) {
        return res.status(400).json({ message: 'userId is required and must not be null or undefined' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        const [rows] = await connection.execute(
            'SELECT * FROM swot_feedback WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
            [userId]
        );

        if (!rows || rows.length === 0) {
            throw new Error('No SWOT feedback found');
        }

        await connection.end();

        res.json({ message: 'SWOT feedback retrieved', userId, report: rows[0].report });
    } catch (error) {
        console.error('Error fetching SWOT feedback:', error);
        res.status(500).json({ message: 'Error fetching SWOT feedback', error: error.message });
    }
};

// Listening (audio upload)
const uploadListeningAudio = async (req, res) => {
    if (!req || !req.file || !req.user || !req.user.id) {
        return res.status(400).json({ message: 'Audio file and user details are required' });
    }

    let connection = null;
    try {
        const key = generateFileKey(req.file, 'listening-audio');
        const url = await uploadToS3(req.file, bucketConfig.listeningAudio, key);

        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO audio_files (user_id, file_key, file_url, type) VALUES (?, ?, ?, ?)',
            [req.user.id, key, url, 'listening']
        );

        if (!result || result.affectedRows !== 1) {
            throw new Error('Failed to insert audio file details into the database');
        }

        res.json({ message: 'Listening audio uploaded', fileUrl: url });
    } catch (error) {
        console.error('Error uploading listening audio:', error);
        res.status(500).json({ message: 'Error uploading listening audio', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
};

// Speaking (audio upload)
const uploadSpeakingAudio = async (req, res) => {
    if (!req || !req.file || !req.user || !req.user.id) {
        return res.status(400).json({ message: 'Audio file and user details are required' });
    }

    let connection;
    try {
        const key = generateFileKey(req.file, 'speaking-audio');
        const url = await uploadToS3(req.file, bucketConfig.speakingAudio, key);

        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            throw new Error('Database connection failed');
        }

        const [result] = await connection.execute(
            'INSERT INTO audio_files (user_id, file_key, file_url, type) VALUES (?, ?, ?, ?)',
            [req.user.id, key, url, 'speaking']
        );

        if (!result || result.affectedRows !== 1) {
            throw new Error('Failed to insert audio file details into the database');
        }

        res.json({ message: 'Speaking audio uploaded', fileUrl: url });
    } catch (error) {
        console.error('Error uploading speaking audio:', error);
        res.status(500).json({ message: 'Error uploading speaking audio', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
};

// Reading (text/audio upload)
const uploadReading = async (req, res) => {
    if (!req || !req.body || !req.body.text || !req.user || !req.user.id) {
        return res.status(400).json({ message: 'Text and user details are required' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Audio file is required' });
    }

    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);

        if (!connection) {
            throw new Error('Database connection failed');
        }

        const key = generateFileKey(req.file, 'reading');
        const url = await uploadToS3(req.file, bucketConfig.reading, key);

        const [result] = await connection.execute(
            'INSERT INTO reading_files (user_id, file_key, file_url, text) VALUES (?, ?, ?, ?)',
            [req.user.id, key, url, req.body.text]
        );

        if (!result || result.affectedRows !== 1) {
            throw new Error('Failed to insert reading file and text details into the database');
        }

        res.json({ message: 'Reading uploaded', fileUrl: url, text: req.body.text });
    } catch (error) {
        console.error('Error uploading reading audio/text:', error);
        res.status(500).json({ message: 'Error uploading reading audio/text', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
};

// Writing (text upload)
const uploadWriting = async (req, res) => {
    const { text } = req.body;
    if (!req || !req.user || !req.user.id || !text) {
        return res.status(400).json({ message: 'User ID and text are required' });
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }

        const [result] = await connection.execute(
            'INSERT INTO writing_files (user_id, text) VALUES (?, ?)',
            [req.user.id, text]
        );

        if (!result || result.affectedRows !== 1) {
            throw new Error('Failed to insert writing text details into the database');
        }

        res.json({ message: 'Writing uploaded', text });
    } catch (error) {
        console.error('Error uploading writing text:', error);
        res.status(500).json({ message: 'Error uploading writing text', error: error.message });
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (closeError) {
                console.error('Error closing database connection:', closeError);
            }
        }
    }
};

// Chatbot proxy
const chatbotProxy = async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ message: 'Message is required' });
    }

    try {
        // Example: Forward to Dialogflow (replace with your bot endpoint)
        const response = await axios.post(process.env.CHATBOT_URL, { message });

        if (!response || !response.data || !response.data.reply) {
            throw new Error('Invalid response structure from chatbot');
        }

        res.json({ reply: response.data.reply });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ message: 'Chatbot error', error: error.message });
    }
};

module.exports = {
    generateQuestions,
    analyzeEssay,
    swotAnalysis,
    getLsrwSwotResultsHistory,
    storeSwotFeedback,
    getSwotFeedback,
    uploadListeningAudio,
    uploadSpeakingAudio,
    uploadReading,
    uploadWriting,
    chatbotProxy
};