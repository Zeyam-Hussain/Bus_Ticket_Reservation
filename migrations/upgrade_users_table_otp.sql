-- Upgrade users table for OTP verification
ALTER TABLE users 
ADD COLUMN otp_code VARCHAR(6) DEFAULT NULL,
ADD COLUMN otp_expiry DATETIME DEFAULT NULL,
ADD COLUMN is_verified TINYINT(1) DEFAULT 0;
