// Result Controller

const getResults = async (req, res) => {
    try {
        const results = await Result.find().populate('user exam');

        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'No results found' });
        }

        res.json({ results });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
};

const getResultById = async (req, res) => {
    const { resultId } = req.params;
    if (!resultId) {
        return res.status(400).json({ message: 'Result ID is required' });
    }

    try {
        const result = await Result.findById(resultId).populate('user exam');
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }

        res.json({ result });
    } catch (error) {
        console.error('Get result by ID error:', error);
        res.status(500).json({ message: 'Error fetching result', error: error.message });
    }
};

const createResult = async (req, res) => {
    const { userId, examId, marks } = req.body;

    if (!userId || !examId || marks === undefined) {
        return res.status(400).json({ message: 'User ID, Exam ID, and marks are required' });
    }

    try {
        const result = await Result.create({ userId, examId, marks });

        if (!result) {
            throw new Error('Failed to create result');
        }

        res.status(201).json({ message: 'Result created successfully', result });
    } catch (error) {
        console.error('Create result error:', error);
        res.status(500).json({ message: 'Error creating result', error: error.message });
    }
};

// Get a student's results
const getResultsByStudent = async (req, res) => {
    // TODO: Implement logic to get results by student
    const { studentId } = req.params;
    res.json({ message: 'Results for student', studentId });
};

// Get all results for an exam
const getResultsByExam = async (req, res) => {
    // TODO: Implement logic to get results by exam
    const { examId } = req.params;
    res.json({ message: 'Results for exam', examId });
};

module.exports = {
    getResults,
    getResultById,
    createResult,
    getResultsByStudent,
    getResultsByExam
};