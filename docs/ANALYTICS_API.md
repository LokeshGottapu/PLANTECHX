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
- **Response:**
  ```json
  [
    {
      "skill_type": "string",
      "average_score": "number",
      "total_assessments": "number"
    }
  ]
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