-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
    college_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_year INT,
    end_year INT,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    stream_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);

-- Users table (students and others)
CREATE TABLE IF NOT EXISTS users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    college_id INT,
    refresh_token VARCHAR(255),
    refresh_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    test_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);

-- College features table
CREATE TABLE IF NOT EXISTS college_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    feature VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT 0,
    UNIQUE KEY unique_college_feature (college_id, feature),
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);