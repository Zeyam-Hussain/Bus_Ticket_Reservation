<?php
// api/user/cancel_booking.php

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

if (empty($data->booking_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "booking_id is required."]);
    exit();
}

$user_id = $decoded_user['user_id'];

try {
    $db->beginTransaction();

    // Check booking exists, belongs to user, and get its current status
    $check = $db->prepare(
        "SELECT user_id, booking_status FROM booking WHERE booking_id = :booking_id LIMIT 1"
    );
    $check->bindParam(':booking_id', $data->booking_id);
    $check->execute();

    if ($check->rowCount() === 0) {
        throw new Exception("Booking not found.", 404);
    }

    $booking = $check->fetch(PDO::FETCH_ASSOC);

    if ($booking['user_id'] != $user_id) {
        throw new Exception("Access denied. This booking does not belong to you.", 403);
    }

    if ($booking['booking_status'] === 'cancelled') {
        throw new Exception("This booking is already cancelled.", 400);
    }

    // Cancel the booking
    $update = $db->prepare("
        UPDATE booking
        SET booking_status = 'cancelled', cancellation_date = NOW()
        WHERE booking_id = :booking_id
    ");
    $update->bindParam(':booking_id', $data->booking_id);
    $update->execute();

    // Mark payment as refunded if one exists
    $refund = $db->prepare(
        "UPDATE payment SET transaction_status = 'refunded' WHERE booking_id = :booking_id"
    );
    $refund->bindParam(':booking_id', $data->booking_id);
    $refund->execute();

    $db->commit();

    http_response_code(200);
    echo json_encode(["status" => "success", "message" => "Booking cancelled successfully."]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("User cancel booking error: " . $e->getMessage());
    $safe = in_array($code, [400, 403, 404]) ? $e->getMessage() : "Server error. Please try again.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
