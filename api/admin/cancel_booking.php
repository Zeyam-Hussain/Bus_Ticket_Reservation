<?php
// api/admin/cancel_booking.php
// FIX: Safe error messages — no internal paths or stack traces exposed.
// IMPROVEMENT: Records cancellation_date for tracking.

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
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

try {
    $db->beginTransaction();

    // Check booking exists and get its current status
    $check = $db->prepare(
        "SELECT booking_status FROM booking WHERE booking_id = :booking_id LIMIT 1"
    );
    $check->bindParam(':booking_id', $data->booking_id);
    $check->execute();

    if ($check->rowCount() === 0) {
        throw new Exception("Booking not found.", 404);
    }

    $booking = $check->fetch(PDO::FETCH_ASSOC);

    if ($booking['booking_status'] === 'cancelled') {
        throw new Exception("This booking is already cancelled.", 400);
    }

    // Cancel the booking (with cancellation timestamp)
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
    error_log("Cancel booking error: " . $e->getMessage());
    $safe = in_array($code, [400, 404]) ? $e->getMessage() : "Server error. Please try again.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
