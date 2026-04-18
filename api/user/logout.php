<?php
// api/user/logout.php  — NEW FILE
// Blacklists the current access token so it cannot be reused after logout.
// Also deletes the user's refresh token from the database.

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php'; // validates + gives $decoded_user

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

try {
    $db->beginTransaction();

    // 1. Add token's jti to blacklist so it cannot be used again
    if (isset($decoded_user['jti'])) {
        $exp = $decoded_user['exp'] ?? (time() + 900);

        $bl = $db->prepare(
            "INSERT IGNORE INTO token_blacklist (jti, expires_at)
             VALUES (:jti, FROM_UNIXTIME(:exp))"
        );
        $bl->bindParam(':jti', $decoded_user['jti']);
        $bl->bindParam(':exp', $exp);
        $bl->execute();
    }

    // 2. Delete the refresh token so a new login is required
    $rt = $db->prepare("DELETE FROM refresh_tokens WHERE user_id = :user_id");
    $rt->bindParam(':user_id', $decoded_user['user_id']);
    $rt->execute();

    $db->commit();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Logged out successfully."]);

} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log("Logout error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error during logout."]);
}
?>
