# Analytics API Documentation

## Student Performance Reports

### Get User Performance
- **Method:** GET
- **Endpoint:** `/api/analytics/user-performance/:userId`
- **Query Parameters:**
  - `examType` (optional): Filter by exam type
  - `startDate` (optional): Start date for date range filter
  - `endDate` (optional): End date for date range filter
- **Response:**
  ```json
  [
    {
      "exam_name": "string",
      "exam_type": "string",
      "score": "number",
      "completion_time": "number",
      "completed_at": "date"
    }
  ]
  ```

### Get Batch Comparison
- **Method:** GET
- **Endpoint:** `/api/analytics/batch-comparison`
- **Query Parameters:**
  - `batchYear`: Year of the batch
  - `examType`: Type of exam
- **Response:**
  ```json
  [
    {
      "batch_year": "number",
      "exam_name": "string",
      "total_students": "number",
      "average_score": "number",
      "high_performers": "number"
    }
  ]
  ```

## Faculty Reports

### Get Faculty Performance
- **Method:** GET
- **Endpoint:** `/api/analytics/faculty-performance/:facultyId`
- **Response:**
  ```json
  {
    "faculty_id": "number",
    "exams_created": "number",
    "questions_contributed": "number",
    "students_assessed": "number"
  }
  ```

## LSRW Analytics

### Get LSRW Performance
- **Method:** GET
- **Endpoint:** `/api/analytics/lsrw-performance/:userId/:examId`
- **Description:** Retrieve detailed LSRW (Listening, Speaking, Reading, Writing) performance metrics for a specific user and exam
- **Parameters:**
  - `userId` (required): The ID of the user
  - `examId` (required): The ID of the exam
- **Query Parameters:**
  - `skillType` (optional): Filter by specific skill (listening, speaking, reading, writing)
  - `startDate` (optional): Start date for analysis period (YYYY-MM-DD)
  - `endDate` (optional): End date for analysis period (YYYY-MM-DD)
- **Success Response (200 OK):**
  ```json
  {
    "userId": 12345,
    "examId": 67890,
    "overallScore": 85.5,
    "skills": [
      {
        "skill_type": "listening",
        "average_score": 88.5,
        "total_assessments": 10,
        "improvement_rate": 15.2,
        "strengths": ["comprehension", "note-taking"],
        "areas_for_improvement": ["accent recognition"]
      },
      {
        "skill_type": "speaking",
        "average_score": 82.0,
        "total_assessments": 8,
        "improvement_rate": 10.5,
        "strengths": ["fluency", "pronunciation"],
        "areas_for_improvement": ["grammar usage"]
      }
    ],
    "progressTrend": {
      "last_month": 12.5,
      "last_quarter": 25.0
    }
  }
  ```
- **Error Responses:**
  - **400 Bad Request:**
    ```json
    {
      "error": "Invalid parameters",
      "details": "Invalid date range specified"
    }
    ```
  - **404 Not Found:**
    ```json
    {
      "error": "Resource not found",
      "details": "No LSRW data found for the specified user and exam"
    }
    ```

### Get LSRW Progress Timeline
- **Method:** GET
- **Endpoint:** `/api/analytics/lsrw-timeline/:userId`
- **Description:** Get historical progress of LSRW skills over time
- **Parameters:**
  - `userId` (required): The ID of the user
- **Query Parameters:**
  - `period` (optional): Analysis period (week, month, quarter, year)
  - `skillType` (optional): Specific skill to analyze
- **Success Response (200 OK):**
  ```json
  {
    "userId": 12345,
    "period": "month",
    "timeline": [
      {
        "date": "2023-11-01",
        "listening": 75.5,
        "speaking": 68.0,
        "reading": 82.5,
        "writing": 77.0
      },
      {
        "date": "2023-11-15",
        "listening": 78.5,
        "speaking": 72.0,
        "reading": 85.0,
        "writing": 79.5
      }
    ],
    "improvement_summary": {
      "listening": "+3.0",
      "speaking": "+4.0",
      "reading": "+2.5",
      "writing": "+2.5"
    }
  }
  ```
- **Error Responses:**
  - **400 Bad Request:**
    ```json
    {
      "error": "Invalid period",
      "details": "Period must be one of: week, month, quarter, year"
    }
    ```

## Exam Success Analytics

### Get Exam Success Metrics
- **Method:** GET
- **Endpoint:** `/api/analytics/exam-metrics/:examId`
- **Response:**
  ```json
  {
    "total_participants": "number",
    "average_score": "number",
    "passing_count": "number",
    "highest_score": "number",
    "best_completion_time": "number"
  }
  ```