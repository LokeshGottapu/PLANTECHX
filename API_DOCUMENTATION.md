# API Documentation

## Authentication Endpoints

### User Authentication
Endpoints related to user authentication and authorization.

#### Register User
- **Method:** POST
- **Endpoint:** `/auth/register`
- **Description:** Register a new user account
- **Request Body:**
  ```json
  {
    "username": "john_doe",
    "password": "SecurePass123!",
    "email": "john.doe@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "message": "User registered successfully",
    "userId": 12345
  }
  ```
- **Error Responses:**
  - **400 Bad Request:**
    ```json
    {
      "error": "Validation failed",
      "details": {
        "username": "Username must be at least 3 characters long",
        "password": "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
        "email": "Invalid email format"
      }
    }
    ```
  - **409 Conflict:**
    ```json
    {
      "error": "Username or email already exists"
    }
    ```

#### Login User
- **Method:** POST
- **Endpoint:** `/auth/login`
- **Description:** Authenticate user and receive access token
- **Request Body:**
  ```json
  {
    "username": "john_doe",
    "password": "SecurePass123!"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 12345,
    "expiresIn": 3600
  }
  ```
- **Error Responses:**
  - **401 Unauthorized:**
    ```json
    {
      "error": "Invalid username or password"
    }
    ```
  - **429 Too Many Requests:**
    ```json
    {
      "error": "Too many login attempts. Please try again in 15 minutes",
      "retryAfter": 500
    }
    ```

## College Management

### Create College
- **Method:** POST
- **Endpoint:** `/api/colleges`
- **Request Body:**
  ```json
  {
    "name": "string",
    "address": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "College created successfully",
    "collegeId": "number"
  }
  ```

### Approve College
- **Method:** PUT
- **Endpoint:** `/api/colleges/:collegeId/approve`
- **Response:**
  ```json
  {
    "message": "College approved successfully"
  }
  ```

### Get Colleges
- **Method:** GET
- **Endpoint:** `/api/colleges`
- **Query Parameters:**
  - status (optional): Filter by college status
- **Response:**
  ```json
  [
    {
      "college_id": "number",
      "name": "string",
      "address": "string",
      "status": "string"
    }
  ]
  ```

## Exam Management

### Create Exam
- **Method:** POST
- **Endpoint:** `/api/exams`
- **Request Body:**
  ```json
  {
    "examName": "string",
    "examType": "string",
    "totalQuestions": "number",
    "duration": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Exam created successfully",
    "examId": "number"
  }
  ```

### Add Question
- **Method:** POST
- **Endpoint:** `/api/exams/questions`
- **Request Body:**
  ```json
  {
    "examId": "number",
    "questionText": "string",
    "questionType": "string",
    "options": "array",
    "correctAnswer": "string",
    "difficultyLevel": "string",
    "topic": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Question added successfully",
    "questionId": "number"
  }
  ```

### Submit Exam
- **Method:** POST
- **Endpoint:** `/api/exams/submit`
- **Request Body:**
  ```json
  {
    "examId": "number",
    "answers": "object",
    "completionTime": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Exam submitted successfully",
    "score": "number",
    "resultId": "number"
  }
  ```

### Get User Performance
- **Method:** GET
- **Endpoint:** `/api/exams/performance/:userId`
- **Query Parameters:**
  - examName (optional): Filter by exam name
  - startDate (optional): Filter by start date
  - endDate (optional): Filter by end date
- **Response:**
  ```json
  [
    {
      "exam_name": "string",
      "exam_type": "string",
      "score": "number",
      "completion_time": "number",
      "completed_at": "number"
    }
  ]
  ```

### Get AI Suggested Questions
- **Method:** GET
- **Endpoint:** `/api/exams/ai-questions`
- **Authentication:** Required (Bearer Token)
- **Query Parameters:**
  - topic: Filter questions by topic
- **Response:**
  ```json
  [
    {
      "question_text": "string",
      "question_type": "string",
      "options": "array",
      "difficulty_level": "string",
      "topic": "string"
    }
  ]
  ```

## File Upload Management

### Upload User Files
- **Method:** POST
- **Endpoint:** `/api/upload/user-uploads`
- **Authentication:** Required (Bearer Token)
- **Content-Type:** multipart/form-data
- **File Restrictions:**
  - Max Size: 5MB per file
  - Max Files: 5
  - Allowed Types: CSV, Excel (.xls, .xlsx)
- **Response:**
  ```json
  {
    "message": "Files uploaded successfully",
    "files": [
      {
        "fileName": "string",
        "fileUrl": "string"
      }
    ]
  }
  ```

### Upload Question Bank
- **Method:** POST
- **Endpoint:** `/api/upload/question-bank`
- **Authentication:** Required (Bearer Token)
- **Content-Type:** multipart/form-data
- **File Restrictions:**
  - Max Size: 10MB per file
  - Max Files: 5
  - Allowed Types: PDF, Word (.doc, .docx)
- **Response:**
  ```json
  {
    "message": "Question bank files uploaded successfully",
    "files": [
      {
        "fileName": "string",
        "fileUrl": "string"
      }
    ]
  }
  ```

### Upload Reports
- **Method:** POST
- **Endpoint:** `/api/upload/reports`
- **Authentication:** Required (Bearer Token)
- **Content-Type:** multipart/form-data
- **File Restrictions:**
  - Max Size: 15MB per file
  - Max Files: 5
  - Allowed Types: PDF, CSV, Excel (.xls, .xlsx)
- **Response:**
  ```json
  {
    "message": "Report files uploaded successfully",
    "files": [
      {
        "fileName": "string",
        "fileUrl": "string"
      }
    ]
  }
  ```

### Delete File
- **Method:** DELETE
- **Endpoint:** `/api/files`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "bucket": "string",
    "key": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "File deleted successfully"
  }
  ```

## Error Responses

All endpoints may return the following error responses:

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid authentication token"
}
```

#### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "You do not have permission to perform this action"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "The requested resource could not be found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later",
  "requestId": "req_123abc456def"
}
```

#### Rate Limiting
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later",
  "retryAfter": 60
}
```

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### Validation Errors
```json
{
  "error": "Validation Error",
  "message": "Description of what went wrong"
}
```

### File Upload Errors
```json
{
  "error": "File Upload Error",
  "message": "Specific error message (e.g., 'File size exceeds limit', 'Invalid file type')"
}
```

### Server Errors
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## College Administration

### Assign College Admin
- **Method:** POST
- **Endpoint:** `/api/colleges/admin`
- **Request Body:**
  ```json
  {
    "userId": "number",
    "collegeId": "number",
    "role": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "College admin assigned successfully"
  }
  ```

### Assign Exam to College
- **Method:** POST
- **Endpoint:** `/api/colleges/exams`
- **Request Body:**
  ```json
  {
    "examId": "number",
    "collegeId": "number",
    "startDate": "string",
    "endDate": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Exam assigned to college successfully"
  }
  ```

### Grant LSRW Access
- **Method:** POST
- **Endpoint:** `/api/colleges/lsrw-access`
- **Request Body:**
  ```json
  {
    "collegeId": "number",
    "accessLevel": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "LSRW access granted successfully"
  }
  ```

### Get College Performance
- **Method:** GET
- **Endpoint:** `/api/colleges/:collegeId/performance`
- **Query Parameters:**
  - startDate (optional): Filter by start date
  - endDate (optional): Filter by end date
- **Response:**
  ```json
  [
    {
      "exam_name": "string",
      "total_participants": "number",
      "average_score": "number",
      "lowest_score": "number",
      "highest_score": "number"
    }
  ]
  ```