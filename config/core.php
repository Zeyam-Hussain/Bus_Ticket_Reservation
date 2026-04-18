<?php
// config/core.php

// ==========================================
// 1. LOAD ENVIRONMENT VARIABLES
// ==========================================
// Reads from the .env file located at the project root (one level above htdocs).
// Never hardcode secrets in PHP files.
$env_path = __DIR__ . '/../.env';
if (file_exists($env_path)) {
    $lines = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0)
            continue; // skip comments
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// ==========================================
// 2. CORS & HEADERS
// ==========================================
// FIX: Restrict origin to your React app only. Replace with your production
// domain when deploying (e.g. "https://yourdomain.com").
$allowed_origin = $_ENV['ALLOWED_ORIGIN'] ?? 'http://localhost:3000';
$request_origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($request_origin === $allowed_origin) {
    header("Access-Control-Allow-Origin: $allowed_origin");
} else {
    header("Access-Control-Allow-Origin: $allowed_origin"); // default fallback
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// 3. CORE APPLICATION SETTINGS
// ==========================================
// FIX: Show errors only in development, never in production.
$app_env = $_ENV['APP_ENV'] ?? 'production';
if ($app_env === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

date_default_timezone_set('Asia/Karachi');

// ==========================================
// 4. SECRETS — loaded from .env only
// ==========================================
// FIX: Never hardcode these. They live in the .env file.
// Generate jwt_secret with: php -r "echo base64_encode(random_bytes(32));"
$jwt_secret_key = $_ENV['JWT_SECRET_KEY'] ?? '';
$admin_creation_secret = $_ENV['ADMIN_CREATION_SECRET'] ?? '';

if (empty($jwt_secret_key)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server configuration error."]);
    exit();
}

// Token expiration: 15 minutes for access tokens
$expiration_time = time() + (60 * 15);
?>