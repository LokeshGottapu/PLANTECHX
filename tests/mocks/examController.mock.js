const mockExamController = {
    createExam: async (req, res) => {
        res.status(201).json({
            message: 'Exam created successfully',
            examId: 1
        });
    },
    
    addQuestion: async (req, res) => {
        res.status(201).json({
            message: 'Question added successfully',
            questionId: 1
        });
    },
    
    submitExam: async (req, res) => {
        res.status(200).json({
            message: 'Exam submitted successfully',
            score: 85,
            resultId: 1
        });
    },
    
    getAIQuestions: async (req, res) => {
        res.status(200).json([
            {
                question_text: 'Mock AI generated question',
                options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                correct_answer: 'Option 1'
            }
        ]);
    }
};

module.exports = mockExamController; 