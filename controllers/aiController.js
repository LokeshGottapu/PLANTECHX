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

        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
            throw new Error('Invalid response structure from OpenAI');
        }

        const feedback = response.data.choices[0].message.content;
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
                strengths,
                weaknesses,
                opportunities,
                threats
            }
        });
    } catch (error) {
        console.error('SWOT analysis error:', error);
        res.status(500).json({ message: 'SWOT analysis failed', error: error.message });
    }
};

// Get LSRW & SWOT results history for a user
const getLsrwSwotResultsHistory = async (req, res) => {
    // TODO: Implement logic to fetch results history
    const { userId } = req.query;
    res.json({ message: 'LSRW & SWOT results history', userId });
};

// Store SWOT feedback report
const storeSwotFeedback = async (req, res) => {
    // TODO: Implement logic to store SWOT feedback
    const { userId, report } = req.body;
    if (!userId || !report) {
        return res.status(400).json({ message: 'userId and report are required' });
    }
    res.json({ message: 'SWOT feedback stored', userId, report });
};

// Get SWOT feedback report
const getSwotFeedback = async (req, res) => {
    // TODO: Implement logic to get SWOT feedback
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }
    res.json({ message: 'SWOT feedback retrieved', userId });
};

module.exports = {
    generateQuestions,
    analyzeEssay,
    swotAnalysis,
    getLsrwSwotResultsHistory,
    storeSwotFeedback,
    getSwotFeedback
};