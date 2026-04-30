<?php
// api/user/refresh_token.php
// Accepts a refresh token, validates it, and returns a new access token.

include_once '../../config/core.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"));

if (empty($data->refresh_token)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "refresh_token is required."]);
    exit();
}

try {
    // 1. Look up the refresh token
    $stmt = $db->prepare("
        SELECT rt.user_id, rt.expires_at, u.full_name, u.role
        FROM refresh_tokens rt
        JOIN users u ON rt.user_id = u.user_id
        WHERE rt.token = :token
        LIMIT 1
    ");
    $stmt->bindParam(':token', $data->refresh_token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid or expired session. Please log in again."]);
        exit();
    }

    $rt = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Check expiry
    if (strtotime($rt['expires_at']) < time()) {
        // Clean up expired token
        $del = $db->prepare("DELETE FROM refresh_tokens WHERE token = :token");
        $del->bindParam(':token', $data->refresh_token);
        $del->execute();

        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Session expired. Please log in again."]);
        exit();
    }

    // Issue a new access token
    $jti     = bin2hex(random_bytes(16));
    $header  = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'jti'       => $jti,
        'user_id'   => $rt['user_id'],
        'full_name' => $rt['full_name'],
        'role'      => $rt['role'],
        'iat'       => time(),
        'exp'       => $expiration_time // 15 min from core.php
    ]);

    $b64H  = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $b64P  = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $sig   = hash_hmac('sha256', $b64H . "." . $b64P, $jwt_secret_key, true);
    $b64S  = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sig));
    $new_access_token = $b64H . "." . $b64P . "." . $b64S;

    http_response_code(200);
    echo json_encode([
        "status"       => "success",
        "access_token" => $new_access_token,
        "expires_in"   => 900
    ]);

} catch (Throwable $e) {
    error_log("Refresh token error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error. Please try again."]);
}
?>
