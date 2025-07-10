// Question Controller

const getQuestions = async (req, res) => {
    try {
        const questions = await questionModel.getQuestions();
        if (!questions) {
            console.error('getQuestions returned null or undefined');
            return res.status(500).json({ message: 'Error fetching questions' });
        }
        res.json(questions);
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
};

const getQuestionById = async (req, res) => {
    const { questionId } = req.params;
    try {
        const question = await questionModel.getQuestionById(questionId);
        if (question === null || question === undefined) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        console.error('Get question by ID error:', error);
        res.status(500).json({ message: 'Error fetching question', error: error.message });
    }
};

const createQuestion = async (req, res) => {
    let connection = null;
    try {
        const { questionText, questionType, options, correctAnswer, difficultyLevel, topic } = req.body;
        if (!questionText || !questionType || !options || !correctAnswer || !difficultyLevel || !topic) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!Array.isArray(options) || options.length === 0) {
            return res.status(400).json({ message: 'Options must be an array with at least one element' });
        }
        if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
            return res.status(400).json({ message: 'Correct answer must be a valid index of the options array' });
        }
        connection = await mysql.createConnection(dbConfig);
        if (!connection) {
            throw new Error('Database connection failed');
        }
        const [result] = await connection.execute(
            'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, difficulty_level, topic) VALUES (NULL, ?, ?, ?, ?, ?, ?)',
            [questionText, questionType, JSON.stringify(options), correctAnswer, difficultyLevel, topic]
        );
        if (!result || !result.insertId) {
            throw new Error('Error adding question');
        }
        await connection.end();
        res.status(201).json({ message: 'Question created successfully', questionId: result.insertId });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ message: 'Error creating question' });
        if (connection) {
            try {
                await connection.end();
            } catch (endError) {
                console.error('Error closing connection:', endError);
            }
        }
    }
};

const updateQuestion = async (req, res) => {
    let connection = null;
    try {
        const { questionId } = req.params;
        const { questionText, questionType, options, correctAnswer, difficultyLevel, topic } = req.body;

        if (!questionId) {
            return res.status(400).json({ message: 'Question ID is required' });
        }

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
        await connection.end();
        if (result && result.affectedRows > 0) {
            res.json({ message: 'Question updated successfully' });
        } else {
            res.status(404).json({ message: 'Question not found' });
        }
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
};

const deleteQuestion = async (req, res) => {
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
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ message: 'Error deleting question', error: error.message });
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
    getQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion
};