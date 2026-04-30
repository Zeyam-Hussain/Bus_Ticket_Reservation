<?php
// api/user/resend_otp.php

include_once '../../config/core.php';
include_once '../../config/database.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once '../../vendor/autoload.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid JSON input."]);
    exit();
}

$email = isset($data->email) ? trim($data->email) : '';

if (!$email) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email is required."]);
    exit();
}

// SMTP Function Helper (Same as in register.php)
function sendOtpEmail($toEmail, $toName, $otpCode) {
    $mail = new PHPMailer(true);
    
    $host = $_ENV['SMTP_HOST'] ?? '';
    $port = $_ENV['SMTP_PORT'] ?? 587;
    $user = $_ENV['SMTP_USER'] ?? '';
    $pass = $_ENV['SMTP_PASS'] ?? '';
    $from = $_ENV['SMTP_FROM'] ?? '';
    $name = $_ENV['SMTP_FROM_NAME'] ?? 'Bus Reservation System';

    if (empty($host) || empty($user) || empty($from)) {
        throw new Exception("SMTP configuration is missing in .env file.");
    }

    $mail->isSMTP();
    $mail->Host       = $host;
    $mail->SMTPAuth   = true;
    $mail->Username   = $user;
    $mail->Password   = $pass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int)$port;

    $mail->setFrom($from, $name);
    $mail->addAddress($toEmail, $toName);

    $mail->isHTML(true);
    $mail->Subject = 'Resend: Email Verification OTP';
    $mail->Body    = "
        <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;'>
            <h2 style='color: #333;'>Verify Your Email</h2>
            <p>You requested a new verification code. Use the OTP below to verify your email address:</p>
            <div style='font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #007bff; padding: 12px 18px; background: #f8f9fa; display: inline-block; border-radius: 6px;'>
                {$otpCode}
            </div>
            <p style='margin-top: 16px;'>This code will expire in 10 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
            <p style='margin-top: 20px; font-size: 12px; color: #777;'>This is an automated email. Please do not reply.</p>
        </div>";

    $mail->send();
}

try {
    // Check if email exists
    $check = $db->prepare("SELECT full_name, is_verified, otp_requests, otp_last_request FROM users WHERE email = :email LIMIT 1");
    $check->bindParam(':email', $email);
    $check->execute();
    $existingUser = $check->fetch(PDO::FETCH_ASSOC);

    if (!$existingUser) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit();
    }

    if ((int)$existingUser['is_verified'] === 1) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email is already verified. You can log in."]);
        exit();
    }

    $today = date("Y-m-d");

    // OTP Request Limit Logic
    $requests = ($existingUser['otp_last_request'] === $today) ? (int)$existingUser['otp_requests'] : 0;
    if ($requests >= 3) {
        http_response_code(429);
        echo json_encode(["status" => "error", "message" => "OTP request limit reached for today (3/day). Try again tomorrow."]);
        exit();
    }

    $otpCode = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpExpiry = date("Y-m-d H:i:s", strtotime("+10 minutes"));
    $newRequests = $requests + 1;

    $stmt = $db->prepare("UPDATE users 
         SET otp_code = :otp, otp_expiry = :exp, otp_requests = :requests, otp_last_request = :today 
         WHERE email = :email");
    $stmt->bindParam(':otp', $otpCode);
    $stmt->bindParam(':exp', $otpExpiry);
    $stmt->bindParam(':requests', $newRequests);
    $stmt->bindParam(':today', $today);
    $stmt->bindParam(':email', $email);

    if ($stmt->execute()) {
        sendOtpEmail($email, $existingUser['full_name'], $otpCode);
        http_response_code(200);
        $response = ["status" => "success", "message" => "A new OTP has been sent to your email."];
        // Only expose OTP in response during development
        if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
            $response['data'] = ['otp_debug' => $otpCode];
        }
        echo json_encode($response);
    } else {
        throw new Exception("Failed to update database.");
    }

} catch (Throwable $e) {
    error_log("Resend OTP error: " . $e->getMessage());
    http_response_code(500);
    $app_env = $_ENV['APP_ENV'] ?? 'production';
    $errorMsg = ($app_env === 'development') ? $e->getMessage() : "Failed to resend email.";
    echo json_encode(["status" => "error", "message" => $errorMsg]);
}
?>
