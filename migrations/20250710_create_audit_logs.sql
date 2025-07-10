-- Migration: Create audit_logs table for admin/faculty actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(32),
    resource_id INT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);
