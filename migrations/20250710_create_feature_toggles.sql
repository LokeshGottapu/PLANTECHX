-- Migration: Create feature_toggles table for feature toggling (LSRW, SWOT, AI)
CREATE TABLE IF NOT EXISTS feature_toggles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feature VARCHAR(32) NOT NULL,
    enabled TINYINT(1) NOT NULL DEFAULT 1,
    college_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    UNIQUE KEY unique_toggle (feature, college_id, user_id)
);
