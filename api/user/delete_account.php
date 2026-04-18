<?php
// api/user/delete_account.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php'; // This makes sure the user is logged in ($decoded_user)

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use DELETE or POST."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$user_id = $decoded_user['user_id'];

// Password verification is crucial for account deletion
if (empty($data->password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Password confirmation is required."]);
    exit();
}

try {
    $db->beginTransaction();

    // Verify Password First
    $stmt = $db->prepare("SELECT password_hash, email FROM users WHERE user_id = :id LIMIT 1");
    $stmt->bindParam(':id', $user_id);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($data->password, $user['password_hash'])) {
        $db->rollBack();
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Incorrect password. Cannot delete account."]);
        exit();
    }

    // Optional Cascade cleanup (handling common tables to prevent constraint failures)
    // Ignore errors if tables don't exist
    try { $db->prepare("DELETE FROM refresh_tokens WHERE user_id = :id")->execute([':id' => $user_id]); } catch (Throwable $e) {}
    try { $db->prepare("DELETE FROM waitlist WHERE user_id = :id")->execute([':id' => $user_id]); } catch (Throwable $e) {}
    try { $db->prepare("DELETE FROM login_attempts WHERE email = :email")->execute([':email' => $user['email']]); } catch (Throwable $e) {}
    
    // Booking related (if schema uses cascade this is redundant, but safe)
    try { 
        $db->prepare("DELETE FROM booked_seats WHERE booking_id IN (SELECT booking_id FROM bookings WHERE user_id = :id)")->execute([':id' => $user_id]);
        $db->prepare("DELETE FROM payments WHERE booking_id IN (SELECT booking_id FROM bookings WHERE user_id = :id)")->execute([':id' => $user_id]);
        $db->prepare("DELETE FROM bookings WHERE user_id = :id")->execute([':id' => $user_id]);
    } catch (Throwable $e) {}

    // Finally delete user
    $del = $db->prepare("DELETE FROM users WHERE user_id = :id");
    $del->bindParam(':id', $user_id);
    
    if($del->execute()) {
        $db->commit();
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Account successfully deleted."]);
    } else {
        throw new Exception("Unable to delete user row.");
    }
} catch (Throwable $e) {
    $db->rollBack();
    error_log("Delete account error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to delete account. Please try again."]);
}
?>
