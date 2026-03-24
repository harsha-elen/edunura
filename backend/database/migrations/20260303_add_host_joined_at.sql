-- Migration: Add host_joined_at to live_sessions
-- Tracks when a host (teacher/admin) first joins a Jitsi meeting.
-- Uses SET/PREPARE pattern for MySQL 8.0 compatibility (no IF NOT EXISTS support).

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'live_sessions' AND column_name = 'host_joined_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE live_sessions ADD COLUMN host_joined_at DATETIME NULL DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
