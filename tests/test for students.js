const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/app_server'); // Adjust path as needed

chai.use(chaiHttp);
const { expect } = chai;

describe('Student API', () => {
    let token;

    before(async () => {
        // Login and get token
        const res = await chai.request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'adminpass' });
        token = res.body.token;
    });

    it('should get all students', async () => {
        const res = await chai.request(app)
            .get('/api/students')
            .set('Authorization', `Bearer ${token}`);
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
    });

    // Add more tests for create, update, delete, bulk-import, filter, etc.
});