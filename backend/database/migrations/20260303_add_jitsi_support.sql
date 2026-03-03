-- Migration: Add Jitsi Support to Live Sessions and Lessons
-- Date: 2026-03-03
-- Description: Add columns to support Jitsi meetings alongside Zoom
-- Note: Schema columns are expected to already exist (defined in schema.sql).
--       This migration ensures the enum and system_settings rows are present.

-- Ensure 'jitsi' is in the category enum (idempotent)
ALTER TABLE system_settings MODIFY COLUMN category enum('payment','storage','email','zoom','jitsi','general','branding','organization','localization') NOT NULL;

-- Insert default Jitsi settings if they don't exist
INSERT IGNORE INTO system_settings (category, `key`, value, description, is_encrypted, created_at, updated_at) VALUES
('jitsi', 'jitsi_domain', 'https://meet.edunura.com', 'Jitsi Meet server domain', 0, NOW(), NOW()),
('jitsi', 'jitsi_app_id', 'edunura_lms', 'Jitsi App ID for JWT authentication', 0, NOW(), NOW()),
('jitsi', 'jitsi_app_secret', 'Edun@123456', 'Jitsi App Secret for JWT authentication', 1, NOW(), NOW()),
('general', 'meeting_platform', 'zoom', 'Default meeting platform (zoom or jitsi)', 0, NOW(), NOW());
