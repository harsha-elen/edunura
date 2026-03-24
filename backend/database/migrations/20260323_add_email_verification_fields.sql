-- Migration: Add Email Verification OTP Columns
-- Description: Adds verification_otp and verification_otp_expires_at to users table for registration flow

ALTER TABLE users
ADD COLUMN verification_otp VARCHAR(255) DEFAULT NULL AFTER is_verified,
ADD COLUMN verification_otp_expires_at DATETIME DEFAULT NULL AFTER verification_otp;
