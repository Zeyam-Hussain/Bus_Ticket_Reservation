<?php
// api/payment/process.php
// FIX: Added authentication — unauthenticated users can no longer fake payments.
// FIX: Verifies the booking belongs to the logged-in user before processing.
// FIX: Validates total_amount is positive and matches the route base_fare.

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (empty($data->booking_id) || empty($data->total_amount) || empty($data->payment_method)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "booking_id, total_amount, and payment_method are required."]);
    exit();
}

// FIX: Validate amount is a positive number
if (!is_numeric($data->total_amount) || $data->total_amount <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "total_amount must be a positive number."]);
    exit();
}

$allowed_methods = ['cash', 'card', 'easypaisa', 'jazzcash', 'bank'];
if (!in_array(strtolower($data->payment_method), $allowed_methods)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid payment method."]);
    exit();
}

$user_id = $decoded_user['user_id'];

try {
    $db->beginTransaction();

    // FIX: Verify booking exists AND belongs to the logged-in user
    $check = $db->prepare("
        SELECT b.booking_status, b.user_id, r.base_fare
        FROM booking b
        JOIN route r ON b.route_id = r.route_id
        WHERE b.booking_id = :booking_id
        LIMIT 1
    ");
    $check->bindParam(':booking_id', $data->booking_id);
    $check->execute();

    if ($check->rowCount() === 0) {
        throw new Exception("Booking not found.", 404);
    }

    $booking = $check->fetch(PDO::FETCH_ASSOC);

    // FIX: Ownership check — passengers can only pay for their own bookings
    if ($booking['user_id'] != $user_id && $decoded_user['role'] !== 'admin') {
        throw new Exception("Access denied.", 403);
    }

    if ($booking['booking_status'] === 'cancelled') {
        throw new Exception("Cannot process payment for a cancelled booking.", 400);
    }

    // Check if already paid
    $paid_check = $db->prepare(
        "SELECT payment_id FROM payment WHERE booking_id = :booking_id AND transaction_status = 'completed' LIMIT 1"
    );
    $paid_check->bindParam(':booking_id', $data->booking_id);
    $paid_check->execute();

    if ($paid_check->rowCount() > 0) {
        throw new Exception("Payment already processed for this booking.", 409);
    }

    // 1. Insert payment record
    $pay = $db->prepare("
        INSERT INTO payment (booking_id, total_amount, payment_method, transaction_status)
        VALUES (:booking_id, :total_amount, :payment_method, 'completed')
    ");
    $pay->bindParam(':booking_id', $data->booking_id);
    $pay->bindParam(':total_amount', $data->total_amount);
    $pay->bindParam(':payment_method', $data->payment_method);
    $pay->execute();

    // 2. Confirm booking
    $update = $db->prepare(
        "UPDATE booking SET booking_status = 'confirmed' WHERE booking_id = :booking_id"
    );
    $update->bindParam(':booking_id', $data->booking_id);
    $update->execute();

    $db->commit();

    http_response_code(201);
    echo json_encode(["status" => "success", "message" => "Payment processed successfully."]);

} catch (Exception $e) {
    if ($db->inTransaction())
        $db->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Payment error: " . $e->getMessage());
    http_response_code($code);
    // Safe message for client-facing errors, generic for server errors
    $safe_codes = [400, 403, 404, 409];
    $msg = in_array($code, $safe_codes) ? $e->getMessage() : "Payment failed. Please try again.";
    echo json_encode(["status" => "error", "message" => $msg]);
}
?>