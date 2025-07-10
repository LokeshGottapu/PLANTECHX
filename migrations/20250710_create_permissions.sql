-- Migration: Create permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_type ENUM('batch','course','exam','result','material') NOT NULL,
    resource_id INT DEFAULT NULL,
    permission ENUM('view','edit','assign','export','approve') NOT NULL,
    granted_by INT DEFAULT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_permission (user_id, resource_type, resource_id, permission)
);
