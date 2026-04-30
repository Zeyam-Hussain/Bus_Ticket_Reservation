<?php
// api/user/login.php

include_once '../../config/core.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"));

if (empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password are required."]);
    exit();
}

$email    = filter_var(trim($data->email), FILTER_SANITIZE_EMAIL);
$password = $data->password;
$ip       = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

try {
    // Rate limiting: max 5 failed attempts per IP per 15 minutes
    $rate_stmt = $db->prepare("
        SELECT COUNT(*) as attempts FROM login_attempts
        WHERE ip_address = :ip
          AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
          AND success = 0
    ");
    $rate_stmt->bindParam(':ip', $ip);
    $rate_stmt->execute();
    $rate_data = $rate_stmt->fetch(PDO::FETCH_ASSOC);

    if ($rate_data['attempts'] >= 5) {
        http_response_code(429);
        echo json_encode(["status" => "error", "message" => "Too many failed attempts. Please wait 15 minutes."]);
        exit();
    }

    // Fetch user
    $stmt = $db->prepare(
        "SELECT user_id, full_name, email, phone, password_hash, role, is_verified FROM users WHERE email = :email LIMIT 1"
    );
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() === 0 || !($user = $stmt->fetch(PDO::FETCH_ASSOC))) {

        $log = $db->prepare("INSERT INTO login_attempts (ip_address, email, success) VALUES (:ip, :email, 0)");
        $log->bindParam(':ip', $ip);
        $log->bindParam(':email', $email);
        $log->execute();

        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
        exit();
    }

    if (!password_verify($password, $user['password_hash'])) {
        $log = $db->prepare("INSERT INTO login_attempts (ip_address, email, success) VALUES (:ip, :email, 0)");
        $log->bindParam(':ip', $ip);
        $log->bindParam(':email', $email);
        $log->execute();

        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
        exit();
    }

    // Check verification status
    if ($user['is_verified'] == 0) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Please verify your email before logging in."]);
        exit();
    }


    $log = $db->prepare("INSERT INTO login_attempts (ip_address, email, success) VALUES (:ip, :email, 1)");
    $log->bindParam(':ip', $ip);
    $log->bindParam(':email', $email);
    $log->execute();

    // Build access token (15 minutes)
    $jti = bin2hex(random_bytes(16)); // unique token ID

    $header  = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'jti'       => $jti,
        'user_id'   => $user['user_id'],
        'full_name' => $user['full_name'],
        'role'      => $user['role'],
        'iat'       => time(),
        'exp'       => $expiration_time  // 15 min, set in core.php
    ]);

    $b64Header   = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $b64Payload  = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature   = hash_hmac('sha256', $b64Header . "." . $b64Payload, $jwt_secret_key, true);
    $b64Sig      = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    $access_token = $b64Header . "." . $b64Payload . "." . $b64Sig;

    // Build refresh token (7 days, stored in DB)
    $refresh_token  = bin2hex(random_bytes(64));
    $refresh_expiry = date('Y-m-d H:i:s', time() + (60 * 60 * 24 * 7));


    $del = $db->prepare("DELETE FROM refresh_tokens WHERE user_id = :user_id");
    $del->bindParam(':user_id', $user['user_id']);
    $del->execute();


    $rt_stmt = $db->prepare("
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES (:user_id, :token, :expires_at)
    ");
    $rt_stmt->bindParam(':user_id',    $user['user_id']);
    $rt_stmt->bindParam(':token',      $refresh_token);
    $rt_stmt->bindParam(':expires_at', $refresh_expiry);
    $rt_stmt->execute();

    // Respond
    http_response_code(200);
    echo json_encode([
        "status"        => "success",
        "message"       => "Login successful.",
        "access_token"  => $access_token,
        "refresh_token" => $refresh_token,
        "expires_in"    => 900, // 15 minutes in seconds
        "data" => [
            "user_id"   => $user['user_id'],
            "full_name" => $user['full_name'],
            "email"     => $user['email'],
            "phone"     => $user['phone'],
            "role"      => $user['role']
        ]
    ]);

} catch (Throwable $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error. Please try again later."]);
}
?>
