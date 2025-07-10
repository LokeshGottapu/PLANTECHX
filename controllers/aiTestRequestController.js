const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');
const axios = require('axios');

// Admin submits a test generation request
const submitAITestRequest = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.body.content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO ai_test_requests (requested_by, content) VALUES (?, ?)',
            [req.user.id, req.body.content]
        );
        await connection.end();
        res.json({ message: 'AI test generation request submitted.' });
    } catch (error) {
        console.error('Error submitting AI test request:', error);
        res.status(500).json({ message: 'Error submitting AI test request', error: error.message });
    }
};

// Master admin views all pending requests
const getPendingAITestRequests = async (req, res) => {
    let connection = null;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [requests] = await connection.execute(
            'SELECT * FROM ai_test_requests WHERE status = "pending"'
        );
        if (!requests) {
            throw new Error('No AI test requests found');
        }
        await connection.end();
        res.json(requests);
    } catch (error) {
        console.error('Error fetching AI test requests:', error);
        res.status(500).json({ message: 'Error fetching AI test requests', error: error.message });
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

// Master admin triggers AI test generation
const generateCustomTest = async (req, res) => {
    let connection = null;
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Request ID is required' });
        }
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Unable to connect to database');
        }
        const [[request]] = await connection.execute(
            'SELECT * FROM ai_test_requests WHERE id = ?', [id]
        );
        if (!request) {
            await connection.end();
            return res.status(404).json({ message: 'Request not found' });
        }
        const prompt = `Generate a custom test based on the following content/requirements: ${request.content}`;
        try {
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
            let aiTest;
            try {
                aiTest = JSON.parse(response.data.choices[0].message.content);
            } catch (parseError) {
                aiTest = { raw: response.data.choices[0].message.content };
                console.log('Error parsing AI response:', parseError);
            }
            await connection.execute(
                'UPDATE ai_test_requests SET status = "completed", generated_test = ? WHERE id = ?',
                [JSON.stringify(aiTest), id]
            );
            await connection.end();
            res.json({ message: 'AI test generated', aiTest });
        } catch (error) {
            console.error('Error generating AI test:', error);
            res.status(500).json({ message: 'Error generating AI test', error: error.message });
        }
    } catch (error) {
        console.error('Error generating AI test:', error);
        res.status(500).json({ message: 'Error generating AI test', error: error.message });
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

// Master admin can reject a request
defaultReject = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Request ID is required' });
        }
        const connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Unable to connect to database');
        }
        const [result] = await connection.execute(
            'UPDATE ai_test_requests SET status = "rejected" WHERE id = ?', [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        await connection.end();
        res.json({ message: 'Request rejected.' });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: 'Error rejecting request', error: error.message });
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

// Update AI test request status (Pending, Approved, Rejected)
const updateTestRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || !status) {
        return res.status(400).json({ message: 'id and status are required' });
    }
    res.json({ message: 'AI test request status updated', id, status });
};

module.exports = {
    submitAITestRequest,
    getPendingAITestRequests,
    generateCustomTest,
    defaultReject,
    updateTestRequestStatus
};
