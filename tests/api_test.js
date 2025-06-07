const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Test user credentials
const testUser = {
  username: 'testuser',
  password: 'testpass123',
  email: 'test@example.com'
};

// Helper function for API calls
async function makeRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
}

// Test Suite
async function runTests() {
  try {
    // Test 1: Register User
    console.log('\nTesting User Registration...');
    const registerResponse = await makeRequest('POST', '/auth/register', testUser);
    assert(registerResponse.message === 'User registered successfully');
    console.log('✓ User registration successful');

    // Test 2: Login User
    console.log('\nTesting User Login...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      username: testUser.username,
      password: testUser.password
    });
    assert(loginResponse.token);
    authToken = loginResponse.token;
    console.log('✓ User login successful');

    // Test 3: Create College
    console.log('\nTesting College Creation...');
    const collegeData = {
      name: 'Test College',
      address: '123 Test Street'
    };
    const collegeResponse = await makeRequest('POST', '/api/colleges', collegeData, authToken);
    assert(collegeResponse.message === 'College created successfully');
    console.log('✓ College creation successful');

    // Test 4: Create Exam
    console.log('\nTesting Exam Creation...');
    const examData = {
      examName: 'Test Exam',
      examType: 'MCQ',
      totalQuestions: 10,
      duration: 60
    };
    const examResponse = await makeRequest('POST', '/api/exams', examData, authToken);
    assert(examResponse.message === 'Exam created successfully');
    console.log('✓ Exam creation successful');

    console.log('\nAll tests passed successfully! ✓');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();