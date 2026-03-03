-- Migration: Remove host_joined_at from live_sessions
-- Host presence is now tracked in-memory (no DB column needed).

ALTER TABLE live_sessions DROP COLUMN IF EXISTS host_joined_at;
