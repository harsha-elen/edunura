-- Migration: Fix Jitsi Settings - Add 'jitsi' to category enum
-- Date: 2026-03-04
-- Description: The original migration (20260303) tried to INSERT rows with
--   category='jitsi' but the production database enum did not include 'jitsi',
--   causing silent failures. This migration fixes the enum first, then re-inserts.

-- Step 1: Add 'jitsi' to the category enum (idempotent - safe if already present)
ALTER TABLE system_settings MODIFY COLUMN category enum('payment','storage','email','zoom','jitsi','general','branding','organization','localization') NOT NULL;

-- Step 2: Re-insert default Jitsi settings (INSERT IGNORE skips if rows already exist)
INSERT IGNORE INTO system_settings (category, `key`, value, description, is_encrypted, created_at, updated_at) VALUES
('jitsi', 'jitsi_domain', 'https://meet.edunura.com', 'Jitsi Meet server domain', 0, NOW(), NOW()),
('jitsi', 'jitsi_app_id', 'edunura_lms', 'Jitsi App ID for JWT authentication', 0, NOW(), NOW()),
('jitsi', 'jitsi_app_secret', 'Edun@123456', 'Jitsi App Secret for JWT authentication', 1, NOW(), NOW()),
('general', 'meeting_platform', 'zoom', 'Default meeting platform (zoom or jitsi)', 0, NOW(), NOW());
