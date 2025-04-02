const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

class QuestionGenerator {
    constructor() {
        this.questionTemplates = {
            definition: [
                'What is {term}?',
                'Define {term}.',
                'Explain the concept of {term}.',
            ],
            application: [
                'How would you apply {term} in a real-world scenario?',
                'What is an example of {term} in practice?',
            ],
            analysis: [
                'Compare and contrast {term1} and {term2}.',
                'What are the key components of {term}?',
                'Analyze the relationship between {term1} and {term2}.',
            ]
        };
    }

    extractKeyTerms(content) {
        const tokens = tokenizer.tokenize(content);
        tfidf.addDocument(content);
        
        const terms = [];
        tfidf.listTerms(0).forEach(item => {
            if (item.tfidf > 5) {
                terms.push(item.term);
            }
        });
        
        return terms;
    }

    generateQuestions(content, topic, numberOfQuestions = 5) {
        const keyTerms = this.extractKeyTerms(content);
        const questions = [];

        for (let i = 0; i < numberOfQuestions && i < keyTerms.length; i++) {
            const term = keyTerms[i];
            const questionType = Object.keys(this.questionTemplates)[i % 3];
            const templates = this.questionTemplates[questionType];
            const template = templates[Math.floor(Math.random() * templates.length)];

            let questionText = template;
            if (template.includes('{term1}') && template.includes('{term2}')) {
                questionText = template
                    .replace('{term1}', term)
                    .replace('{term2}', keyTerms[(i + 1) % keyTerms.length]);
            } else {
                questionText = template.replace('{term}', term);
            }

            questions.push({
                question_text: questionText,
                topic: topic,
                marks: 5,
                options: null,
                correct_answer: null,
                difficulty_level: 'medium',
                question_type: questionType
            });
        }

        return questions;
    }

    validateQuestion(question) {
        return (
            question.question_text &&
            question.question_text.length >= 10 &&
            question.topic &&
            question.marks > 0
        );
    }

    async generateAndSaveQuestions(content, examId, topic, numberOfQuestions) {
        const questions = this.generateQuestions(content, topic, numberOfQuestions);
        const validQuestions = questions.filter(q => this.validateQuestion(q));

        return validQuestions.map(q => ({
            ...q,
            exam_id: examId
        }));
    }
}

module.exports = new QuestionGenerator();