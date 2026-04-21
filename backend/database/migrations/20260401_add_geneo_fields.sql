-- Migration: Add Geneo integration fields to courses table
-- Purpose: Store Geneo access settings (enabled, class, subject) for each course
-- Date: 2026-04-01

ALTER TABLE `courses` ADD COLUMN `geneo_enabled` TINYINT(1) DEFAULT 0 COMMENT 'Enable Geneo access for this course' AFTER `visibility`;

ALTER TABLE `courses` ADD COLUMN `geneo_class` VARCHAR(50) DEFAULT NULL COMMENT 'Class for Geneo integration (1-10)' AFTER `geneo_enabled`;

ALTER TABLE `courses` ADD COLUMN `geneo_subject` VARCHAR(100) DEFAULT NULL COMMENT 'Subject for Geneo integration (maths, physics, science)' AFTER `geneo_class`;

-- Add index for Geneo enabled for faster filtering
CREATE INDEX `idx_geneo_enabled` ON `courses` (`geneo_enabled`);
