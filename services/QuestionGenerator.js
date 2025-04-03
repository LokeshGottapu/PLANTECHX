const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();
const sentiment = new natural.SentimentAnalyzer();
const ner = new natural.NERClassifier();
const wordnet = new natural.WordNet();

class QuestionGenerator {
    constructor() {
        this.questionTemplates = {
            definition: [
                'What is {term}?',
                'Define {term}.',
                'Explain the concept of {term}.',
                'What are the key characteristics of {term}?',
                'How would you describe {term} to someone new to this field?'
            ],
            application: [
                'How would you apply {term} in a real-world scenario?',
                'What is an example of {term} in practice?',
                'Describe a situation where {term} would be most effective.',
                'How does {term} solve practical problems?',
                'What are the benefits of implementing {term}?'
            ],
            analysis: [
                'Compare and contrast {term1} and {term2}.',
                'What are the key components of {term}?',
                'Analyze the relationship between {term1} and {term2}.',
                'How does {term} impact the overall system?',
                'What are the potential limitations of {term}?'
            ],
            evaluation: [
                'Evaluate the effectiveness of {term} in {context}.',
                'What are the pros and cons of using {term}?',
                'How would you measure the success of {term} implementation?'
            ],
            synthesis: [
                'How would you combine {term1} and {term2} to create a better solution?',
                'Propose a new approach using {term} to solve {context}.',
                'Design a system that incorporates {term} effectively.'
            ]
        };
    }

    async extractKeyTerms(content) {
        const tokens = tokenizer.tokenize(content);
        tfidf.addDocument(content);
        
        const terms = [];
        const entities = await ner.classify(content);
        
        // Get important terms based on TF-IDF
        tfidf.listTerms(0).forEach(item => {
            if (item.tfidf > 5) {
                terms.push({
                    term: item.term,
                    importance: item.tfidf,
                    type: 'keyword'
                });
            }
        });
        
        // Add named entities
        entities.forEach(entity => {
            terms.push({
                term: entity.value,
                type: entity.type,
                importance: 8
            });
        });
        
        // Get synonyms and related terms using WordNet
        const enrichedTerms = await Promise.all(terms.map(async term => {
            const synsets = await new Promise(resolve => {
                wordnet.lookup(term.term, results => resolve(results));
            });
            
            return {
                ...term,
                synonyms: synsets.map(synset => synset.synonyms).flat(),
                definition: synsets[0]?.definition || ''
            };
        }));
        
        return enrichedTerms;
    }

    async generateQuestions(content, topic, numberOfQuestions = 5) {
        const keyTerms = await this.extractKeyTerms(content);
        const contentSentiment = sentiment.analyze(content);
        const questions = [];

        for (let i = 0; i < numberOfQuestions && i < keyTerms.length; i++) {
            const termObj = keyTerms[i];
            const term = termObj.term;
            const questionType = Object.keys(this.questionTemplates)[i % Object.keys(this.questionTemplates).length];
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
                difficulty_level: termObj.importance > 7 ? 'hard' : termObj.importance > 5 ? 'medium' : 'easy',
                context: termObj.definition || '',
                sentiment: contentSentiment.score,
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