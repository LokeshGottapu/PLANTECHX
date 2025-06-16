const axios = require('axios');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5000';
let authToken;

describe('PLANTECHX API Tests', () => {
    // Test health check endpoint
    describe('Health Check', () => {
        it('should return server status', async () => {
            try {
                const response = await axios.get(`${BASE_URL}/health`);
                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('status', 'OK');
            } catch (error) {
                console.error('Health check error:', error.response?.data);
                throw error;
            }
        });
    });

    // Test user registration and login
    describe('Authentication', () => {
        it('should register a new user', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test@123',
                role: 'admin'
            };

            try {
                const response = await axios.post(`${BASE_URL}/auth/register`, userData);
                expect(response.status).to.equal(201);
                expect(response.data).to.have.property('token');
                expect(response.data).to.have.property('user');
                authToken = response.data.token;
            } catch (error) {
                console.error('Registration error:', error.response?.data);
                throw error;
            }
        });

        it('should login with registered user', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Test@123'
            };

            try {
                const response = await axios.post(`${BASE_URL}/auth/login`, loginData);
                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('token');
                expect(response.data).to.have.property('user');
                authToken = response.data.token; // Update token after login
            } catch (error) {
                console.error('Login error:', error.response?.data);
                throw error;
            }
        });
    });

    // Test college management
    describe('College Management', () => {
        it('should create a new college', async () => {
            const collegeData = {
                name: 'Test College',
                email: 'college@test.com',
                address: '123 Test St'
            };

            try {
                const response = await axios.post(
                    `${BASE_URL}/colleges`,
                    collegeData,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                expect(response.status).to.equal(201);
                expect(response.data).to.have.property('collegeId');
            } catch (error) {
                console.error('Create college error:', error.response?.data);
                throw error;
            }
        });

        it('should get all colleges', async () => {
            try {
                const response = await axios.get(
                    `${BASE_URL}/colleges`,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                expect(response.status).to.equal(200);
                expect(response.data).to.be.an('array');
            } catch (error) {
                console.error('Get colleges error:', error.response?.data);
                throw error;
            }
        });
    });

    // Test exam management
    describe('Exam Management', () => {
        let examId;

        it('should create a new exam', async () => {
            const examData = {
                title: 'Test Exam',
                description: 'Test Description',
                duration: 60,
                totalMarks: 100
            };

            try {
                const response = await axios.post(
                    `${BASE_URL}/exams`,
                    examData,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                expect(response.status).to.equal(201);
                expect(response.data).to.have.property('examId');
                examId = response.data.examId;
            } catch (error) {
                console.error('Create exam error:', error.response?.data);
                throw error;
            }
        });

        it('should add a question to the exam', async () => {
            const questionData = {
                question_text: 'What is 2+2?',
                options: JSON.stringify(['3', '4', '5', '6']),
                correct_answer: '4',
                marks: 5
            };

            try {
                const response = await axios.post(
                    `${BASE_URL}/exams/${examId}/questions`,
                    questionData,
                    {
                        headers: { Authorization: `Bearer ${authToken}` }
                    }
                );
                expect(response.status).to.equal(201);
                expect(response.data).to.have.property('questionId');
            } catch (error) {
                console.error('Add question error:', error.response?.data);
                throw error;
            }
        });
    });

    // Test file upload
    describe('File Upload', () => {
        it('should upload a file', async () => {
            // Create a temporary test PDF file
            const testFilePath = path.join(__dirname, 'test.pdf');
            fs.writeFileSync(testFilePath, '%PDF-1.4 test pdf content');

            try {
                const formData = new FormData();
                formData.append('files', fs.createReadStream(testFilePath));

                const response = await axios.post(
                    `${BASE_URL}/upload/user`,
                    formData,
                    {
                        headers: {
                            ...formData.getHeaders(),
                            Authorization: `Bearer ${authToken}`
                        }
                    }
                );
                expect(response.status).to.equal(200);
                expect(response.data).to.have.property('files');
            } catch (error) {
                console.error('File upload error:', error.response?.data);
                throw error;
            } finally {
                // Clean up the test file
                fs.unlinkSync(testFilePath);
            }
        });
    });
}); 