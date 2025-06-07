const request = require('supertest');
const { expect } = require('chai');
const app = require('../test-app');

describe('Authentication Integration Tests', () => {
    let authToken;
    const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test@123'
    };

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(testUser);
            
            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('message', 'User registered successfully');
            expect(res.body).to.have.property('userId');
        });

        it('should not register duplicate user', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send(testUser);
            
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('message', 'User already exists');
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });
            
            expect(res.status).to.equal(200);
            expect(res.body.data).to.have.property('token');
            authToken = res.body.data.token;
        });

        it('should fail with wrong password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });
            
            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('message', 'Invalid credentials');
        });
    });

    describe('Rate Limiting', () => {
        it('should block after 5 failed attempts', async () => {
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/auth/login')
                    .send({
                        email: testUser.email,
                        password: 'wrongpassword'
                    });
            }

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });
            
            expect(res.status).to.equal(429);
            expect(res.body).to.have.property('error', 'Too many login attempts, please try again later.');
        });
    });
}); 