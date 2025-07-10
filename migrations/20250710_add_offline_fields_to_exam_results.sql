-- Migration: Add offline support fields to exam_results
ALTER TABLE exam_results
ADD COLUMN is_offline TINYINT(1) DEFAULT 0,
ADD COLUMN synced_at DATETIME DEFAULT NULL;
