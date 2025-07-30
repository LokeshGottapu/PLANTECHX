CREATE TABLE IF NOT EXISTS ai_test_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requested_by INT NOT NULL,
    content TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    generated_test TEXT,
    syllabus_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES users(userId) ON DELETE CASCADE
);