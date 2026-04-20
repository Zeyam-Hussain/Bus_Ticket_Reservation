<?php
// api/booking/unlock_seat.php

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
$data     = json_decode(file_get_contents("php://input"), true);

if (empty($data['route_id']) || empty($data['seat_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "route_id and seat_id are required."]);
    exit();
}

$user_id  = $decoded_user['user_id'];
$route_id = (int) $data['route_id'];
$seat_id  = (int) $data['seat_id'];

try {
    // Only the user who locked it can unlock it early
    $stmt = $db->prepare("
        DELETE FROM seat_locks 
        WHERE route_id = :route_id AND seat_id = :seat_id AND user_id = :user_id
    ");
    $stmt->bindParam(':route_id', $route_id);
    $stmt->bindParam(':seat_id', $seat_id);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Seat unlocked successfully."]);

} catch (Exception $e) {
    error_log("Unlock error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to unlock seat."]);
}
?>
