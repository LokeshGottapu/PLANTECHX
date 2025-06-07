const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app_server');

describe('Exam Management Integration Tests', () => {
    let authToken;
    let examId;
    let questionId;

    before(async () => {
        // Login as faculty
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'faculty@example.com',
                password: 'faculty123'
            });
        
        authToken = res.body.data.token;
    });

    describe('POST /exams', () => {
        it('should create a new exam', async () => {
            const res = await request(app)
                .post('/exams')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    examName: 'Test Exam',
                    examType: 'MCQ',
                    totalQuestions: 10,
                    duration: 60,
                    examDate: '2024-03-25',
                    retakePolicy: 'allowed',
                    maxRetakes: 2,
                    timeLimit: 60,
                    shuffleQuestions: true
                });
            
            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('message', 'Exam created successfully');
            expect(res.body).to.have.property('examId');
            examId = res.body.examId;
        });

        it('should not create exam without authorization', async () => {
            const res = await request(app)
                .post('/exams')
                .send({
                    examName: 'Test Exam 2',
                    examType: 'MCQ',
                    totalQuestions: 10,
                    duration: 60
                });
            
            expect(res.status).to.equal(401);
        });
    });

    describe('POST /exams/:examId/questions', () => {
        it('should add a question to exam', async () => {
            const res = await request(app)
                .post(`/exams/${examId}/questions`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    questionText: 'What is Node.js?',
                    questionType: 'MCQ',
                    options: ['Runtime environment', 'Framework', 'Library', 'Language'],
                    correctAnswer: 'Runtime environment',
                    difficultyLevel: 'medium',
                    topic: 'Node.js Basics'
                });
            
            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('message', 'Question added successfully');
            expect(res.body).to.have.property('questionId');
            questionId = res.body.questionId;
        });
    });

    describe('GET /exams/ai-questions', () => {
        it('should get AI suggested questions', async () => {
            const res = await request(app)
                .get('/exams/ai-questions')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ topic: 'Node.js' });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.have.property('question_text');
            expect(res.body[0]).to.have.property('options');
        });
    });

    describe('POST /exams/:examId/submit', () => {
        it('should submit exam answers', async () => {
            const res = await request(app)
                .post(`/exams/${examId}/submit`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    answers: {
                        [questionId]: 'Runtime environment'
                    },
                    completionTime: 45
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Exam submitted successfully');
            expect(res.body).to.have.property('score');
            expect(res.body).to.have.property('resultId');
        });
    });

    describe('GET /exams/performance/:userId', () => {
        it('should get user performance', async () => {
            const res = await request(app)
                .get('/exams/performance/1') // Assuming user ID 1
                .set('Authorization', `Bearer ${authToken}`)
                .query({
                    examType: 'MCQ',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31'
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.have.property('exam_name');
            expect(res.body[0]).to.have.property('score');
            expect(res.body[0]).to.have.property('completion_time');
        });
    });

    describe('GET /faculty/lsrw/:examId', () => {
        it('should get LSRW analytics', async () => {
            const res = await request(app)
                .get(`/faculty/lsrw/${examId}`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.have.property('skill_type');
            expect(res.body[0]).to.have.property('average_score');
        });
    });

    describe('GET /faculty/batch-comparison', () => {
        it('should get batch comparison', async () => {
            const res = await request(app)
                .get('/faculty/batch-comparison')
                .set('Authorization', `Bearer ${authToken}`)
                .query({
                    batchYear: 2024,
                    examType: 'MCQ'
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.have.property('batch_year');
            expect(res.body[0]).to.have.property('average_score');
        });
    });
}); 