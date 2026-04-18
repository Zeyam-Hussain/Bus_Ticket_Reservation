# OTP Verification System Upgrade

This upgrade adds a 6-digit Email OTP Verification system to the user registration flow using PHPMailer.

## 1. Database Schema Update
Run the following SQL command on your database to add the required columns:

```sql
ALTER TABLE users 
ADD COLUMN otp_code VARCHAR(6) DEFAULT NULL,
ADD COLUMN otp_expiry DATETIME DEFAULT NULL,
ADD COLUMN is_verified TINYINT(1) DEFAULT 0;
```
*I have saved this in [upgrade_users_table_otp.sql](file:///opt/lampp/htdocs/bus_backend/migrations/upgrade_users_table_otp.sql).*

## 2. SMTP Configuration
Update your `.env` file with your SMTP credentials:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
SMTP_FROM_NAME="Bus Reservation System"
```
*I have added these placeholders to [ .env](file:///opt/lampp/htdocs/bus_backend/.env).*

## 3. Library Installation
PHPMailer is required. If it's not already installed, run:
```bash
composer require phpmailer/phpmailer
```

## 4. Modified Files

| File | Changes |
| :--- | :--- |
| [register.php](file:///opt/lampp/htdocs/bus_backend/api/user/register.php) | Generates a 6-digit OTP, sets expiry to 10 mins, and sends an HTML email via PHPMailer. |
| [verify_otp.php](file:///opt/lampp/htdocs/bus_backend/api/user/verify_otp.php) | **New Endpoint.** Validates email and OTP code. Updates `is_verified` to 1 on success. |
| [login.php](file:///opt/lampp/htdocs/bus_backend/api/user/login.php) | Updated to block login for users with `is_verified = 0`. |

## 5. API Usage

### Registration
**POST** `/api/user/register.php`
- Payload: `{"full_name": "...", "email": "...", "phone": "...", "password": "...", "confirm_password": "..."}`
- Response: Success message asking to check email for OTP.

### Verification
**POST** `/api/user/verify_otp.php`
- Payload: `{"email": "user@example.com", "otp_code": "123456"}`
- Responses:
    - `200 OK`: Verification successful.
    - `401 Unauthorized`: Invalid or expired OTP.
    - `404 Not Found`: User not found.
