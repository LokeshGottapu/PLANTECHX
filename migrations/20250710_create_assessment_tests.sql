-- Migration: Create assessment_tests table for Assessment Section
CREATE TABLE IF NOT EXISTS assessment_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section ENUM('arithmetic', 'reasoning', 'verbal', 'coding') NOT NULL,
    topic VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    questions JSON NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
