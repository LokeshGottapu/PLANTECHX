const { describe, it, before, after } = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const examModel = require('../models/examModel');
const database = require('../config/database');

describe('Exam Model', () => {
    let testExamId;
    const testExam = {
        examName: 'Test Exam',
        examType: 'MCQ',
        totalQuestions: 10,
        duration: 60,
        examDate: new Date(),
        retakePolicy: 'allowed',
        maxRetakes: 2,
        timeLimit: 60,
        shuffleQuestions: true,
        createdBy: 'test-user-id'
    };

    before(async () => {
        await database.connect();
    });

    after(async () => {
        await database.query('DELETE FROM exams WHERE exam_name = ?', [testExam.examName]);
        await database.end();
    });

    describe('createExam', () => {
        it('should create a new exam', async () => {
            const result = await examModel.createExam(testExam);
            expect(result).to.have.property('insertId');
            testExamId = result.insertId;
        });

        it('should throw error for duplicate exam name', async () => {
            try {
                await examModel.createExam(testExam);
                throw new Error('Expected error was not thrown');
            } catch (error) {
                expect(error.message).to.include('duplicate');
            }
        });
    });

    describe('getExam', () => {
        it('should retrieve exam by id', async () => {
            const exam = await examModel.getExam(testExamId);
            expect(exam).to.have.property('exam_name', testExam.examName);
            expect(exam).to.have.property('exam_type', testExam.examType);
        });

        it('should return null for non-existent exam', async () => {
            const exam = await examModel.getExam(99999);
            expect(exam).to.be.null;
        });
    });

    describe('updateExam', () => {
        it('should update exam details', async () => {
            const updates = {
                examName: 'Updated Test Exam',
                duration: 90
            };
            const result = await examModel.updateExam(testExamId, updates);
            expect(result.affectedRows).to.equal(1);

            const updatedExam = await examModel.getExam(testExamId);
            expect(updatedExam.exam_name).to.equal(updates.examName);
            expect(updatedExam.duration).to.equal(updates.duration);
        });
    });

    describe('deleteExam', () => {
        it('should delete an exam', async () => {
            const result = await examModel.deleteExam(testExamId);
            expect(result.affectedRows).to.equal(1);

            const deletedExam = await examModel.getExam(testExamId);
            expect(deletedExam).to.be.null;
        });
    });

    describe('getUserPerformance', () => {
        it('should get user exam performance', async () => {
            const userId = 'test-user-id';
            const performance = await examModel.getUserPerformance(userId, {
                examType: 'MCQ',
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date()
            });
            expect(performance).to.be.an('array');
        });
    });

    describe('getBatchComparison', () => {
        it('should get batch comparison data', async () => {
            const comparison = await examModel.getBatchComparison('2023', 'MCQ');
            expect(comparison).to.be.an('object');
            expect(comparison).to.have.property('averageScore');
            expect(comparison).to.have.property('totalStudents');
        });
    });

    describe('getLSRWPerformance', () => {
        it('should get LSRW performance metrics', async () => {
            const userId = 'test-user-id';
            const examId = testExamId;
            const performance = await examModel.getLSRWPerformance(userId, examId);
            expect(performance).to.be.an('object');
            expect(performance).to.have.all.keys(['listening', 'speaking', 'reading', 'writing']);
        });
    });

    describe('getExamSuccessMetrics', () => {
        it('should get exam success metrics', async () => {
            const metrics = await examModel.getExamSuccessMetrics(testExamId);
            expect(metrics).to.be.an('object');
            expect(metrics).to.have.all.keys([
                'totalAttempts',
                'averageScore',
                'passRate',
                'averageCompletionTime'
            ]);
        });
    });
});