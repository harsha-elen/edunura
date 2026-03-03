-- Migration: Add host_joined_at to live_sessions
-- Tracks when a host (teacher/admin) first joins a Jitsi meeting.
-- Used to gate student access: "Join" button is disabled until host_joined_at IS NOT NULL.

ALTER TABLE live_sessions
    ADD COLUMN IF NOT EXISTS host_joined_at DATETIME NULL DEFAULT NULL
        COMMENT 'Timestamp when host (teacher/admin) first joined the Jitsi meeting. NULL = host has not joined yet.';
