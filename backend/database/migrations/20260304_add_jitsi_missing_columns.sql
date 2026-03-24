-- Migration: Add Jitsi support columns to lessons and live_sessions
-- Date: 2026-03-04
-- Description: Adds content_platform, jitsi_room_name, jitsi_join_url to lessons
--              and meeting_type, jitsi_room_name, jitsi_config to live_sessions.
--              Fully idempotent — safe on both old and new databases.

-- ── lessons.content_platform ──
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'lessons' AND column_name = 'content_platform');
SET @sql = IF(@col_exists = 0, "ALTER TABLE lessons ADD COLUMN content_platform enum('zoom','jitsi') DEFAULT 'zoom'", "ALTER TABLE lessons MODIFY COLUMN content_platform enum('zoom','jitsi') DEFAULT 'zoom'");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── lessons.jitsi_room_name ──
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'lessons' AND column_name = 'jitsi_room_name');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE lessons ADD COLUMN jitsi_room_name varchar(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── lessons.jitsi_join_url ──
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'lessons' AND column_name = 'jitsi_join_url');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE lessons ADD COLUMN jitsi_join_url varchar(1000) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── live_sessions.meeting_type ──
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'live_sessions' AND column_name = 'meeting_type');
SET @sql = IF(@col_exists = 0, "ALTER TABLE live_sessions ADD COLUMN meeting_type enum('zoom','jitsi') DEFAULT 'zoom'", "ALTER TABLE live_sessions MODIFY COLUMN meeting_type enum('zoom','jitsi') DEFAULT 'zoom'");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── live_sessions.jitsi_room_name ──
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'live_sessions' AND column_name = 'jitsi_room_name');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE live_sessions ADD COLUMN jitsi_room_name varchar(255) UNIQUE DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── live_sessions.jitsi_config ──
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'live_sessions' AND column_name = 'jitsi_config');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE live_sessions ADD COLUMN jitsi_config json DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
