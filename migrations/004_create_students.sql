CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    enrollment_number VARCHAR(100),
    batch_id INT,
    stream_id INT,
    FOREIGN KEY (user_id) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE SET NULL,
    FOREIGN KEY (stream_id) REFERENCES streams(stream_id) ON DELETE SET NULL
);