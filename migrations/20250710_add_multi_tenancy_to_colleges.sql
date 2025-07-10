-- Migration: Add multi-tenancy isolation setting to colleges
ALTER TABLE colleges ADD COLUMN multi_tenancy_isolation TINYINT(1) DEFAULT 1;
