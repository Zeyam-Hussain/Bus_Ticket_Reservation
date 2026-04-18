<?php
// api/user/register_admin.php
// FIX: Admin secret now loaded from .env via core.php, not hardcoded.
// FIX: Safe error messages.

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

try {
    $check = $db->prepare("SELECT user_id FROM users WHERE email = :email LIMIT 1");
    $check->bindParam(':email', $email);
    $check->execute();

    if ($check->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        exit();
    }

    $hashed = password_hash($data->password, PASSWORD_BCRYPT);

    $stmt = $db->prepare(
        "INSERT INTO users (full_name, email, password_hash, role)
         VALUES (:full_name, :email, :password_hash, :role)"
    );
    $stmt->bindParam(':full_name',     $fullName);
    $stmt->bindParam(':email',         $email);
    $stmt->bindParam(':password_hash', $hashed);
    $stmt->bindParam(':role',          $role);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Admin account created successfully."]);
    } else {
        throw new Exception("Insert failed.");
    }

} catch (Throwable $e) {
    error_log("Register admin error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error. Please try again."]);
}
?>
