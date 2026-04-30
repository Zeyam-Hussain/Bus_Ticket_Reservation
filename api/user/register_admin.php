<?php
// api/user/register_admin.php
// FIX: Admin secret now loaded from .env via core.php, not hardcoded.
// FIX: Safe error messages.
// FIX: Added Email OTP verification for admin registration.

include_once '../../config/core.php';
include_once '../../config/database.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once '../../vendor/autoload.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"));

if (
    empty($data->full_name)    ||
    empty($data->email)        ||
    empty($data->password)     ||
    empty($data->admin_secret)
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Name, email, password, and admin_secret are all required."]);
    exit();
}

// FIX: $admin_creation_secret comes from .env via core.php
if ($data->admin_secret !== $admin_creation_secret) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Registration denied."]);
    exit();
}

$fullName = htmlspecialchars(strip_tags($data->full_name));
$email    = filter_var(trim($data->email), FILTER_SANITIZE_EMAIL);
$role     = 'admin';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid email format."]);
    exit();
}

// SMTP Function Helper
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
    $mail->Subject = 'Admin Email Verification OTP';
    $mail->Body    = "
        <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;'>
            <h2 style='color: #333;'>Verify Your Admin Account</h2>
            <p>You are registering as an Administrator. Use the OTP below to verify your email address:</p>
            <div style='font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #007bff; padding: 12px 18px; background: #f8f9fa; display: inline-block; border-radius: 6px;'>
                {$otpCode}
            </div>
            <p style='margin-top: 16px;'>This code will expire in 10 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
        </div>";

    $mail->send();
}

try {
    $check = $db->prepare("SELECT user_id, is_verified, otp_requests, otp_last_request FROM users WHERE email = :email LIMIT 1");
    $check->bindParam(':email', $email);
    $check->execute();
    $existingUser = $check->fetch(PDO::FETCH_ASSOC);

    $today = date("Y-m-d");
    $otpCode = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpExpiry = date("Y-m-d H:i:s", strtotime("+10 minutes"));
    $hashed = password_hash($data->password, PASSWORD_BCRYPT);

    if ($existingUser) {
        if ((int)$existingUser['is_verified'] === 1) {
            http_response_code(409);
            echo json_encode(["status" => "error", "message" => "Email is already registered and verified."]);
            exit();
        }

        // OTP Request Limit Logic
        $requests = ($existingUser['otp_last_request'] === $today) ? (int)$existingUser['otp_requests'] : 0;
        if ($requests >= 3) {
            http_response_code(429);
            echo json_encode(["status" => "error", "message" => "OTP request limit reached for today (3/day). Try again tomorrow."]);
            exit();
        }

        $newRequests = $requests + 1;
        $stmt = $db->prepare("UPDATE users 
             SET full_name = :full_name, password_hash = :password_hash, role = :role, 
                 otp_code = :otp, otp_expiry = :exp, otp_requests = :requests, otp_last_request = :today, is_verified = 0 
             WHERE email = :email");
        $stmt->bindParam(':requests', $newRequests);
        $stmt->bindParam(':today', $today);
    } else {
        $stmt = $db->prepare("INSERT INTO users 
                (full_name, email, password_hash, role, otp_code, otp_expiry, is_verified, otp_requests, otp_last_request)
             VALUES 
                (:full_name, :email, :password_hash, :role, :otp, :exp, 0, 1, :today)");
        $stmt->bindParam(':today', $today);
    }

    $stmt->bindParam(':full_name',     $fullName);
    $stmt->bindParam(':email',         $email);
    $stmt->bindParam(':password_hash', $hashed);
    $stmt->bindParam(':role',          $role);
    $stmt->bindParam(':otp',           $otpCode);
    $stmt->bindParam(':exp',           $otpExpiry);

    if ($stmt->execute()) {
        sendOtpEmail($email, $fullName, $otpCode);
        http_response_code(201);
        $response = ["status" => "success", "message" => "Registration successful. Please check your email for the OTP.", "data" => ["email" => $email]];
        // Only expose OTP in response during development
        if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
            $response['data']['otp_debug'] = $otpCode;
        }
        echo json_encode($response);
    } else {
        throw new Exception("Insert/Update failed.");
    }

} catch (Throwable $e) {
    error_log("Register admin error: " . $e->getMessage());
    http_response_code(500);
    $app_env = $_ENV['APP_ENV'] ?? 'production';
    $errorMsg = ($app_env === 'development') ? $e->getMessage() : "Registration failed or email could not be sent.";
    echo json_encode(["status" => "error", "message" => $errorMsg]);
}
?>
