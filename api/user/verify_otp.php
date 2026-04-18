<?php
// api/user/verify_otp.php

include_once '../../config/core.php';
include_once '../../config/database.php';

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
$otpCode = isset($data->otp_code) ? trim($data->otp_code) : '';

if (!$email || !$otpCode) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and OTP code are required."]);
    exit();
}

try {
    $stmt = $db->prepare(
        "SELECT user_id, otp_code, otp_expiry, is_verified
         FROM users
         WHERE email = :email
         LIMIT 1"
    );
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit();
    }

    if ((int)$user['is_verified'] === 1) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Email is already verified. You can now login."]);
        exit();
    }

    if (empty($user['otp_code']) || empty($user['otp_expiry'])) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "OTP session not found. Please register again."]);
        exit();
    }

    if ($user['otp_code'] !== $otpCode) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid OTP code."]);
        exit();
    }

    $currentTime = date("Y-m-d H:i:s");
    if ($currentTime > $user['otp_expiry']) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "OTP has expired. Please register again."]);
        exit();
    }

    $updateStmt = $db->prepare(
        "UPDATE users
         SET is_verified = 1,
             otp_code = NULL,
             otp_expiry = NULL
         WHERE email = :email"
    );
    $updateStmt->bindParam(':email', $email);

    if ($updateStmt->execute()) {
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Email verified successfully. You can now log in."
        ]);
    } else {
        throw new Exception("Failed to update user status.");
    }

} catch (Throwable $e) {
    error_log("Verify OTP error: " . $e->getMessage());
    http_response_code(500);
    $app_env = $_ENV['APP_ENV'] ?? 'production';
    $errorMsg = ($app_env === 'development') ? $e->getMessage() : "Server error during OTP verification.";
    echo json_encode(["status" => "error", "message" => $errorMsg]);
}
?>