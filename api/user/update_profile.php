<?php
// api/user/update_profile.php
// Allows an authenticated user to update their own name, phone, or password.

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"));
$user_id  = $decoded_user['user_id'];

try {
    $fields = [];
    $params = [':user_id' => $user_id];

    // Update full_name if provided
    if (!empty($data->full_name)) {
        $fields[]               = "full_name = :full_name";
        $params[':full_name']   = htmlspecialchars(strip_tags($data->full_name));
    }

    // Update phone if provided
    if (!empty($data->phone)) {
        $fields[]            = "phone = :phone";
        $params[':phone']    = htmlspecialchars(strip_tags($data->phone));
    }

    // Update password if provided (requires current_password for verification)
    if (!empty($data->new_password)) {
        if (empty($data->current_password)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "current_password is required to set a new password."]);
            exit();
        }

        if (strlen($data->new_password) < 8 ||
            !preg_match('/[A-Za-z]/', $data->new_password) ||
            !preg_match('/[0-9]/', $data->new_password)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "New password must be at least 8 characters with letters and numbers."]);
            exit();
        }

        // Verify current password
        $pw_stmt = $db->prepare("SELECT password_hash FROM users WHERE user_id = :user_id LIMIT 1");
        $pw_stmt->bindParam(':user_id', $user_id);
        $pw_stmt->execute();
        $row = $pw_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !password_verify($data->current_password, $row['password_hash'])) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Current password is incorrect."]);
            exit();
        }

        $fields[]                  = "password_hash = :password_hash";
        $params[':password_hash']  = password_hash($data->new_password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Nothing to update. Provide full_name, phone, or new_password."]);
        exit();
    }

    $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
    $stmt  = $db->prepare($query);

    foreach ($params as $key => &$val) {
        $stmt->bindParam($key, $val);
    }

    $stmt->execute();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Profile updated successfully."]);

} catch (Throwable $e) {
    error_log("Update profile error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error. Please try again."]);
}
?>
