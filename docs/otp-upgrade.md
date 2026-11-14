# OTP Verification

The registration flow sends a six-digit email verification code using PHPMailer.
The full PostgreSQL schema, including the OTP columns, is in `database/schema.sql`.
For an older PostgreSQL database, apply `migrations/upgrade_users_table_otp.sql`:

```sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6),
    ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP,
    ADD COLUMN IF NOT EXISTS otp_requests INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS otp_last_request DATE,
    ADD COLUMN IF NOT EXISTS is_verified SMALLINT NOT NULL DEFAULT 0;
```

## SMTP

The Compose app sends OTP emails through a real SMTP server configured in `.env`. For Gmail, use a Google App Password, not your normal account password:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_AUTH=true
SMTP_SECURE=tls
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM=your-address@gmail.com
SMTP_FROM_NAME="Bus Reservation System"
```
