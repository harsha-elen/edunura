-- Fix Jitsi Credentials - Run this on your existing database
-- This updates the empty Jitsi settings with proper values

-- Update Jitsi domain
UPDATE system_settings 
SET value = 'https://meet.edunura.com', 
    description = 'Jitsi Meet server domain' 
WHERE `key` = 'jitsi_domain';

-- Update Jitsi App ID
UPDATE system_settings 
SET value = 'edunura_lms', 
    description = 'Jitsi App ID for JWT authentication' 
WHERE `key` = 'jitsi_app_id';

-- Update Jitsi App Secret
UPDATE system_settings 
SET value = 'Edun@123456', 
    description = 'Jitsi App Secret for JWT authentication' 
WHERE `key` = 'jitsi_app_secret';

-- Verify the updates
SELECT `key`, value, description FROM system_settings WHERE `key` LIKE 'jitsi%';
