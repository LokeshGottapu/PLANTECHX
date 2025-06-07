const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app_server');

describe('College Management Integration Tests', () => {
    let authToken;
    let collegeId;

    before(async () => {
        // Login as admin
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'admin123'
            });
        
        authToken = res.body.data.token;
    });

    describe('POST /colleges', () => {
        it('should create a new college', async () => {
            const res = await request(app)
                .post('/colleges')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test College',
                    address: '123 Test Street'
                });
            
            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('message', 'College created successfully');
            expect(res.body).to.have.property('collegeId');
            collegeId = res.body.collegeId;
        });

        it('should not create college without authorization', async () => {
            const res = await request(app)
                .post('/colleges')
                .send({
                    name: 'Test College 2',
                    address: '456 Test Street'
                });
            
            expect(res.status).to.equal(401);
        });
    });

    describe('PUT /colleges/:collegeId/approve', () => {
        it('should approve college', async () => {
            const res = await request(app)
                .put(`/colleges/${collegeId}/approve`)
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'College approved successfully');
        });
    });

    describe('GET /colleges', () => {
        it('should get all colleges', async () => {
            const res = await request(app)
                .get('/colleges')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.have.property('name');
            expect(res.body[0]).to.have.property('address');
            expect(res.body[0]).to.have.property('status');
        });

        it('should filter colleges by status', async () => {
            const res = await request(app)
                .get('/colleges?status=approved')
                .set('Authorization', `Bearer ${authToken}`);
            
            expect(res.status).to.equal(200);
            expect(res.body).to.be.an('array');
            res.body.forEach(college => {
                expect(college.status).to.equal('approved');
            });
        });
    });

    describe('POST /colleges/admin', () => {
        it('should assign admin to college', async () => {
            const res = await request(app)
                .post('/colleges/admin')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    userId: 2, // Assuming user exists
                    collegeId: collegeId,
                    role: 'college_admin'
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'College admin assigned successfully');
        });
    });

    describe('POST /colleges/exam', () => {
        it('should assign exam to college', async () => {
            const res = await request(app)
                .post('/colleges/exam')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    examId: 1, // Assuming exam exists
                    collegeId: collegeId,
                    startDate: '2024-03-20',
                    endDate: '2024-03-21'
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Exam assigned to college successfully');
        });
    });

    describe('POST /colleges/lsrw-access', () => {
        it('should grant LSRW access', async () => {
            const res = await request(app)
                .post('/colleges/lsrw-access')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    collegeId: collegeId,
                    accessLevel: 'full'
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'LSRW access granted successfully');
        });
    });

    describe('GET /colleges/:collegeId/performance', () => {
        it('should get college performance', async () => {
            const res = await request(app)
                .get(`/colleges/${collegeId}/performance`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-12-31'
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('averageScore');
            expect(res.body).to.have.property('totalStudents');
            expect(res.body).to.have.property('examsPassed');
        });
    });
}); 