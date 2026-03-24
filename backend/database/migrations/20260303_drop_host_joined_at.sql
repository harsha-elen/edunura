-- Migration: Remove host_joined_at from live_sessions
-- Host presence is now tracked in-memory (no DB column needed).
-- Uses SET/PREPARE pattern for MySQL 8.0 compatibility.

SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'live_sessions' AND column_name = 'host_joined_at');
SET @sql = IF(@col_exists > 0, 'ALTER TABLE live_sessions DROP COLUMN host_joined_at', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
