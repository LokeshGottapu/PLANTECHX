-- Migration: Create faculty_approvals table
CREATE TABLE IF NOT EXISTS faculty_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    remarks VARCHAR(255) DEFAULT NULL,
    INDEX (faculty_id)
);
