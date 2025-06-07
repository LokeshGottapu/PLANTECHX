const request = require('supertest');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const app = require('../../src/app_server');

describe('File Upload Integration Tests', () => {
    let authToken;
    let uploadedFileUrl;

    before(async () => {
        // Login as faculty
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: 'faculty@example.com',
                password: 'faculty123'
            });
        
        authToken = res.body.data.token;

        // Create test files
        const testFilesDir = path.join(__dirname, 'test-files');
        if (!fs.existsSync(testFilesDir)) {
            fs.mkdirSync(testFilesDir);
        }

        // Create a test CSV file
        fs.writeFileSync(
            path.join(testFilesDir, 'test.csv'),
            'name,age\nJohn,30\nJane,25'
        );

        // Create a test PDF file
        fs.writeFileSync(
            path.join(testFilesDir, 'test.pdf'),
            'Mock PDF content'
        );
    });

    after(() => {
        // Cleanup test files
        const testFilesDir = path.join(__dirname, 'test-files');
        if (fs.existsSync(testFilesDir)) {
            fs.rmSync(testFilesDir, { recursive: true });
        }
    });

    describe('POST /upload/user', () => {
        it('should upload user files', async () => {
            const res = await request(app)
                .post('/upload/user')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', path.join(__dirname, 'test-files', 'test.csv'));
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Files uploaded successfully');
            expect(res.body.files[0]).to.have.property('fileUrl');
            uploadedFileUrl = res.body.files[0].fileUrl;
        });

        it('should reject oversized files', async () => {
            // Create a large file (6MB)
            const largeFile = path.join(__dirname, 'test-files', 'large.csv');
            const buffer = Buffer.alloc(6 * 1024 * 1024, 'x');
            fs.writeFileSync(largeFile, buffer);

            const res = await request(app)
                .post('/upload/user')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', largeFile);
            
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('message').that.includes('File size exceeds limit');
        });
    });

    describe('POST /upload/question-bank', () => {
        it('should upload question bank files', async () => {
            const res = await request(app)
                .post('/upload/question-bank')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', path.join(__dirname, 'test-files', 'test.pdf'));
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Question bank files uploaded successfully');
            expect(res.body.files[0]).to.have.property('fileUrl');
        });
    });

    describe('POST /upload/report', () => {
        it('should upload report files', async () => {
            const res = await request(app)
                .post('/upload/report')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('files', path.join(__dirname, 'test-files', 'test.csv'));
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'Report files uploaded successfully');
            expect(res.body.files[0]).to.have.property('fileUrl');
        });
    });

    describe('DELETE /files', () => {
        it('should delete uploaded file', async () => {
            // Extract bucket and key from uploadedFileUrl
            const urlParts = uploadedFileUrl.split('/');
            const key = urlParts[urlParts.length - 1];
            const bucket = 'user-uploads'; // This should match your S3 bucket configuration

            const res = await request(app)
                .delete('/files')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    bucket,
                    key
                });
            
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('message', 'File deleted successfully');
        });
    });
}); 