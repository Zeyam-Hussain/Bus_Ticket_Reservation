-- PostgreSQL migration for installations created before OTP verification.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP,
    ADD COLUMN IF NOT EXISTS otp_requests INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS otp_last_request DATE,
    ADD COLUMN IF NOT EXISTS is_verified SMALLINT NOT NULL DEFAULT 0;
