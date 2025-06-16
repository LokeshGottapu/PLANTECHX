-- Create database
CREATE DATABASE IF NOT EXISTS plantechx;
USE plantechx;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('master_admin', 'admin', 'faculty', 'user') DEFAULT 'user',
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
    college_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    total_questions INT NOT NULL,
    duration INT NOT NULL,
    created_by INT,
    exam_date DATETIME,
    retake_policy BOOLEAN DEFAULT FALSE,
    max_retakes INT DEFAULT 0,
    shuffle_questions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(userId)
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'essay', 'short_answer') DEFAULT 'multiple_choice',
    options JSON,
    correct_answer VARCHAR(255),
    marks INT DEFAULT 1,
    topic VARCHAR(100),
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE
);

-- Create user_results table
CREATE TABLE IF NOT EXISTS user_results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    exam_id INT,
    score DECIMAL(5,2),
    completion_time INT,
    answers JSON,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(userId),
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id)
);

-- Create faculty_departments table
CREATE TABLE IF NOT EXISTS faculty_departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    college_id INT,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(userId),
    FOREIGN KEY (college_id) REFERENCES colleges(college_id),
    FOREIGN KEY (department_id) REFERENCES faculty_departments(department_id)
); 