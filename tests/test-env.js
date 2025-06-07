const mockRequire = require('mock-require');
const openaiMock = require('./mocks/openai.mock');
const mockExamController = require('./mocks/examController.mock');

// Mock dependencies
mockRequire('openai', openaiMock);
mockRequire('../controllers/examController', mockExamController);

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRY = '1h';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'plantech_test';
process.env.AWS_ACCESS_KEY_ID = 'test_access_key';
process.env.AWS_SECRET_ACCESS_KEY = 'test_secret_key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_BUCKET_NAME = 'test-bucket';
process.env.OPENAI_API_KEY = 'test_openai_key'; 