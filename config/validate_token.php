<?php
// config/validate_token.php
// FIX: Added algorithm verification to prevent "alg:none" attack.
// FIX: Added token blacklist check for logout support.
// FIX: Generic error messages — no internal details exposed.

include_once __DIR__ . '/core.php';

// ==========================================
// 1. EXTRACT BEARER TOKEN FROM HEADER
// ==========================================
$authHeader = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
} elseif (function_exists('apache_request_headers')) {
    $requestHeaders = apache_request_headers();
    if (isset($requestHeaders['Authorization'])) {
        $authHeader = trim($requestHeaders['Authorization']);
    } elseif (isset($requestHeaders['authorization'])) {
        $authHeader = trim($requestHeaders['authorization']);
    }
}

if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Access denied. Authentication required."]);
    exit();
}

$jwt = $matches[1];

// ==========================================
// 2. SPLIT AND VALIDATE TOKEN STRUCTURE
// ==========================================
$tokenParts = explode('.', $jwt);
if (count($tokenParts) !== 3) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Access denied. Invalid token."]);
    exit();
}

[$headerB64, $payloadB64, $signatureProvided] = $tokenParts;

// ==========================================
// 3. FIX: VERIFY ALGORITHM IN HEADER
// Prevents "alg:none" bypass attack
// ==========================================
$headerJson = base64_decode(str_replace(['-', '_'], ['+', '/'], $headerB64));
$headerData = json_decode($headerJson, true);

if (!$headerData || !isset($headerData['alg']) || $headerData['alg'] !== 'HS256') {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Access denied. Invalid token."]);
    exit();
}

// ==========================================
// 4. VERIFY SIGNATURE
// ==========================================
$signature        = hash_hmac('sha256', $headerB64 . "." . $payloadB64, $jwt_secret_key, true);
$expectedSig      = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

if (!hash_equals($expectedSig, $signatureProvided)) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Access denied. Invalid token."]);
    exit();
}

// ==========================================
// 5. DECODE PAYLOAD AND CHECK EXPIRATION
// ==========================================
$payloadData = json_decode(
    base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadB64)),
    true
);

if (!$payloadData) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Access denied. Invalid token."]);
    exit();
}

if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Session expired. Please log in again."]);
    exit();
}

// ==========================================
// 6. FIX: CHECK TOKEN BLACKLIST (for logout)
// ==========================================
if (isset($payloadData['jti'])) {
    include_once __DIR__ . '/database.php';
    $db_check    = new Database();
    $conn_check  = $db_check->getConnection();

    $bl_stmt = $conn_check->prepare(
        "SELECT id FROM token_blacklist WHERE jti = :jti LIMIT 1"
    );
    $bl_stmt->bindParam(':jti', $payloadData['jti']);
    $bl_stmt->execute();

    if ($bl_stmt->rowCount() > 0) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Session expired. Please log in again."]);
        exit();
    }
}

// ==========================================
// 7. SUCCESS — expose decoded user to caller
// ==========================================
$decoded_user = $payloadData;
?>
