-- Migration: Create integration_settings table for third-party API keys
CREATE TABLE IF NOT EXISTS integration_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    provider VARCHAR(32) NOT NULL, -- e.g., 'zoom', 'gmeet'
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider_college (college_id, provider)
);
