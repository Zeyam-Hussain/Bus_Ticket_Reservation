<?php
// api/booking/lock_seat.php

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

if (empty($data['route_id']) || empty($data['seat_id']) || empty($data['gender'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "route_id, seat_id, and gender are required."]);
    exit();
}

$user_id  = $decoded_user['user_id'];
$route_id = (int) $data['route_id'];
$seat_id  = (int) $data['seat_id'];
$gender   = $data['gender'];

try {
    $db->beginTransaction();

    // Clean up expired locks first
    $cleanup = $db->prepare("DELETE FROM seat_locks WHERE locked_until <= NOW()");
    $cleanup->execute();

    // Check if the seat is already booked permanently
    $booked_check = $db->prepare("
        SELECT booking_id FROM booking 
        WHERE route_id = :route_id AND seat_id = :seat_id AND booking_status = 'confirmed'
    ");
    $booked_check->bindParam(':route_id', $route_id);
    $booked_check->bindParam(':seat_id', $seat_id);
    $booked_check->execute();
    
    if ($booked_check->rowCount() > 0) {
        throw new Exception("Seat is already permanently booked.", 409);
    }

    // Check if the seat is already locked by someone else
    $lock_check = $db->prepare("
        SELECT user_id, gender FROM seat_locks 
        WHERE route_id = :route_id AND seat_id = :seat_id AND locked_until > NOW()
    ");
    $lock_check->bindParam(':route_id', $route_id);
    $lock_check->bindParam(':seat_id', $seat_id);
    $lock_check->execute();

    if ($lock_check->rowCount() > 0) {
        $lock = $lock_check->fetch(PDO::FETCH_ASSOC);
        if ($lock['user_id'] != $user_id) {
            throw new Exception("Seat is currently held by another user.", 409);
        }
    }

    // Insert or update lock (Upsert)
    $lock_stmt = $db->prepare("
        INSERT INTO seat_locks (route_id, seat_id, user_id, gender, locked_until) 
        VALUES (:route_id, :seat_id, :user_id, :gender, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
        ON DUPLICATE KEY UPDATE 
            user_id = VALUES(user_id), 
            gender = VALUES(gender), 
            locked_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
    ");
    
    $lock_stmt->bindParam(':route_id', $route_id);
    $lock_stmt->bindParam(':seat_id', $seat_id);
    $lock_stmt->bindParam(':user_id', $user_id);
    $lock_stmt->bindParam(':gender', $gender);
    $lock_stmt->execute();

    $db->commit();
    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Seat locked successfully for 10 minutes."]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
