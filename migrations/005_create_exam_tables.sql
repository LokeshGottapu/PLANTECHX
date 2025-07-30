-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- e.g., 'practice', 'assessment', 'mock', 'company-specific'
    total_questions INT NOT NULL,
    duration INT NOT NULL, -- in minutes
    created_by INT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50), -- e.g., 'mcq', 'short-answer'
    options TEXT, -- JSON string for MCQ options
    correct_answer TEXT,
    difficulty_level VARCHAR(50),
    topic VARCHAR(100),
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- User Results table
CREATE TABLE IF NOT EXISTS user_results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    score INT,
    started_at DATETIME,
    completed_at DATETIME,
    details TEXT, -- JSON for answers, etc.
    FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- Exam Categories table (optional, if you want a separate table)
CREATE TABLE IF NOT EXISTS exam_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Exam Assignments table (for assigning exams to students/groups)
CREATE TABLE IF NOT EXISTS exam_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    user_id INT, -- or group_id if you support group assignments
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE
);