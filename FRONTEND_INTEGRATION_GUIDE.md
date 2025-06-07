# Frontend Integration Guide

## Base Configuration

### API Base URL
- Development: `http://localhost:5000`
- Production: Configure using environment variable `FRONTEND_URL`

### Required Headers
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>' // Required for protected routes
}
```

## Authentication

### Register User
```javascript
POST /auth/register
Body: {
  "username": "string",
  "password": "string",
  "email": "string"
}
Response: {
  "message": "User registered successfully",
  "userId": number
}
```

### Login
```javascript
POST /auth/login
Body: {
  "username": "string",
  "password": "string"
}
Response: {
  "token": "string",
  "userId": number,
  "expiresIn": number
}
```

## Rate Limiting

### Global Rate Limits
- 100 requests per 15 minutes per IP
- Response on limit exceeded:
```javascript
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Authentication Rate Limits
- 5 login/register attempts per hour
- Response on limit exceeded:
```javascript
{
  "error": "Too many login attempts, please try again later."
}
```

## File Upload Guidelines

### User Uploads
- Maximum file size: 5MB
- Supported formats:
  - CSV
  - Excel (.xls, .xlsx)
- Maximum files per request: 5

### Question Bank Uploads
- Maximum file size: 10MB
- Supported formats:
  - PDF
  - Word (.doc, .docx)
- Maximum files per request: 5

### Report Uploads
- Maximum file size: 15MB
- Supported formats:
  - PDF
  - CSV
  - Excel (.xlsx)
- Maximum files per request: 5

### Example Upload
```javascript
const formData = new FormData();
files.forEach(file => formData.append('files', file));

// For user uploads
fetch('/upload/user', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});

// For question bank uploads (faculty only)
fetch('/upload/question-bank', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});

// For report uploads (admin only)
fetch('/upload/report', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

### File Upload Error Handling
```javascript
async function handleFileUpload(files, uploadType) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  try {
    const response = await fetch(`/upload/${uploadType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // Handle specific upload errors
    if (error.message.includes('File size exceeds')) {
      // Handle file size error
    } else if (error.message.includes('Invalid file type')) {
      // Handle file type error
    } else if (error.message.includes('Maximum files')) {
      // Handle too many files error
    }
    throw error;
  }
}
```

## Error Handling

### Standard Error Response Format
```javascript
{
  "error": "Error message"
}
```

### Common HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## API Endpoints

### College Management
```javascript
// Create College (Admin only)
POST /colleges
Body: {
  "name": "string",
  "address": "string"
}

// Get Colleges (Authenticated users)
GET /colleges

// Approve College (Admin only)
PUT /colleges/:collegeId/approve

// Assign College Admin (Admin only)
POST /colleges/admin

// Assign Exam to College (Admin only)
POST /colleges/exam

// Grant LSRW Access (Admin only)
POST /colleges/lsrw-access

// Get College Performance (Authenticated users)
GET /colleges/:collegeId/performance
```

### Exam Management
```javascript
// Create Exam (Faculty only)
POST /exams
Body: {
  "examName": "string",
  "examType": "string",
  "totalQuestions": number,
  "duration": number
}

// Add Questions (Faculty only)
POST /exams/:examId/questions
Body: {
  "questionText": "string",
  "questionType": "string",
  "options": array,
  "correctAnswer": "string",
  "difficultyLevel": "string",
  "topic": "string"
}

// Submit Exam (Authenticated users)
POST /exams/:examId/submit
Body: {
  "answers": object,
  "completionTime": number
}
```

### Faculty Analytics
```javascript
// Get Faculty Performance (Admin only)
GET /faculty/:facultyId/performance

// Get LSRW Analytics (Faculty only)
GET /faculty/lsrw/:examId

// Get Batch Comparison (Faculty only)
GET /faculty/batch-comparison

// Generate Reports (Admin only)
GET /faculty/:facultyId/report/pdf
GET /faculty/:facultyId/report/excel
```

### User Management
```javascript
// Get Users (Admin only)
GET /users?page=1&limit=5

// Create User
POST /user
Body: {
  // User data fields
}

// Get User by ID (Authenticated users)
GET /users/:userId

// Update User (Admin only)
PUT /users/:userId
Body: {
  // Updated user data
}

// Delete User (Admin only)
DELETE /users/:userId
```

## Best Practices

1. **Token Management**
   - Store JWT token securely (e.g., HttpOnly cookies)
   - Implement token refresh mechanism
   - Clear token on logout

2. **Error Handling**
   ```javascript
   try {
     const response = await fetch('/api/endpoint');
     if (!response.ok) {
       const error = await response.json();
       throw new Error(error.message);
     }
     const data = await response.json();
   } catch (error) {
     // Handle error appropriately
   }
   ```

3. **Rate Limit Handling**
   ```javascript
   // Implement exponential backoff
   const fetchWithRetry = async (url, options, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await fetch(url, options);
         if (response.status !== 429) return response;
         const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
         await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
       } catch (error) {
         if (i === maxRetries - 1) throw error;
       }
     }
   };
   ```

4. **File Upload**
   - Validate file size and type before upload
   - Show upload progress
   - Handle upload errors gracefully

## Health Check
```javascript
GET /health
Response: {
  "status": "OK",
  "timestamp": "ISO date string"
}
```

## Development Setup

1. Install dependencies
2. Set up environment variables
3. Configure API base URL
4. Implement authentication flow
5. Set up error handling
6. Test rate limiting behavior

## Questions and Support

For any questions or issues during integration, please:
1. Check the API documentation
2. Test endpoints in development environment first
3. Contact the backend team with specific error messages and scenarios 