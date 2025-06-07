const QuestionGenerator = require('../services/QuestionGenerator');
const assert = require('assert');
const { describe, it, before } = require('mocha');
const chai = require('chai');
const expect = chai.expect;

describe('QuestionGenerator Service', () => {
    let questionGenerator;
    const sampleContent = `
        Artificial Intelligence (AI) is a branch of computer science that aims to create
        intelligent machines. Machine Learning is a subset of AI that enables systems
        to learn from data. Deep Learning, therefore, is a specialized form of machine
        learning that uses neural networks with multiple layers.
    `;

    before(() => {
        questionGenerator = new QuestionGenerator();
    });

    describe('extractKeyTerms', () => {
        it('should extract key terms from content', async () => {
            const terms = await questionGenerator.extractKeyTerms(sampleContent);
            expect(terms).to.be.an('array');
            expect(terms.length).to.be.greaterThan(0);
            expect(terms[0]).to.have.property('term');
            expect(terms[0]).to.have.property('importance');
            expect(terms[0]).to.have.property('type');
        });

        it('should identify entities correctly', async () => {
            const terms = await questionGenerator.extractKeyTerms(sampleContent);
            const aiTerm = terms.find(t => t.term.toLowerCase().includes('artificial intelligence'));
            expect(aiTerm).to.exist;
            expect(aiTerm.importance).to.be.greaterThan(5);
        });

        it('should include contextual information', async () => {
            const terms = await questionGenerator.extractKeyTerms(sampleContent);
            const termWithContext = terms.find(t => t.definition || t.synonyms);
            expect(termWithContext).to.exist;
        });
    });

    describe('generateQuestions', () => {
        it('should generate specified number of questions', async () => {
            const numberOfQuestions = 3;
            const questions = await questionGenerator.generateQuestions(
                sampleContent,
                'Computer Science',
                numberOfQuestions
            );
            expect(questions).to.have.lengthOf(numberOfQuestions);
        });

        it('should generate questions with required properties', async () => {
            const questions = await questionGenerator.generateQuestions(
                sampleContent,
                'Computer Science',
                1
            );
            expect(questions[0]).to.have.all.keys(
                'question_text',
                'topic',
                'marks',
                'options',
                'correct_answer',
                'difficulty_level',
                'context',
                'sentiment',
                'question_type',
                'contextual_patterns',
                'related_concepts'
            );
        });

        it('should generate questions of different types', async () => {
            const questions = await questionGenerator.generateQuestions(
                sampleContent,
                'Computer Science',
                5
            );
            const questionTypes = questions.map(q => q.question_type);
            const uniqueTypes = new Set(questionTypes);
            expect(uniqueTypes.size).to.be.greaterThan(1);
        });

        it('should handle empty content gracefully', async () => {
            const questions = await questionGenerator.generateQuestions(
                '',
                'Computer Science',
                1
            );
            expect(questions).to.be.an('array');
            expect(questions.length).to.equal(0);
        });
    });

    describe('validateQuestion', () => {
        it('should validate valid questions', () => {
            const validQuestion = {
                question_text: 'What is Artificial Intelligence?',
                topic: 'Computer Science',
                marks: 5
            };
            expect(questionGenerator.validateQuestion(validQuestion)).to.be.true;
        });

        it('should reject invalid questions', () => {
            const invalidQuestion = {
                question_text: '',
                topic: 'Computer Science',
                marks: 0
            };
            expect(questionGenerator.validateQuestion(invalidQuestion)).to.be.false;
        });
    });

    describe('generateAndSaveQuestions', () => {
        it('should generate and format questions for saving', async () => {
            const examId = 'test-exam-id';
            const questions = await questionGenerator.generateAndSaveQuestions(
                sampleContent,
                examId,
                'Computer Science',
                2
            );
            expect(questions).to.be.an('array');
            expect(questions[0]).to.have.property('exam_id', examId);
            expect(questions).to.have.lengthOf.at.least(1);
        });

        it('should filter out invalid questions', async () => {
            const examId = 'test-exam-id';
            const questions = await questionGenerator.generateAndSaveQuestions(
                '',
                examId,
                'Computer Science',
                2
            );
            expect(questions).to.be.an('array');
            questions.forEach(q => {
                expect(questionGenerator.validateQuestion(q)).to.be.true;
            });
        });
    });
});