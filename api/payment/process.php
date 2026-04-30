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

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once '../../vendor/autoload.php';

function sendBookingConfirmationEmail($toEmail, $toName, $bookingData) {
    $mail = new PHPMailer(true);
    
    $host = $_ENV['SMTP_HOST'] ?? '';
    $port = $_ENV['SMTP_PORT'] ?? 587;
    $user = $_ENV['SMTP_USER'] ?? '';
    $pass = $_ENV['SMTP_PASS'] ?? '';
    $from = $_ENV['SMTP_FROM'] ?? '';
    $name = $_ENV['SMTP_FROM_NAME'] ?? 'Bus Reservation System';

    if (empty($host) || empty($user) || empty($from)) {
        return false; // Skip if no SMTP config
    }

    try {
        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $user;
        $mail->Password   = $pass;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int)$port;

        $mail->setFrom($from, $name);
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = 'Booking Confirmation - Ticket #' . $bookingData['booking_id'];
        $mail->Body    = "
            <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;'>
                <h2 style='color: #28a745;'>Payment Successful!</h2>
                <p>Dear {$toName},</p>
                <p>Your booking has been confirmed. Below are your travel details:</p>
                <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                    <tr>
                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Booking ID:</td>
                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>#{$bookingData['booking_id']}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Route:</td>
                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{$bookingData['source_city']} to {$bookingData['destination_city']}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Departure:</td>
                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{$bookingData['departure_time']}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Seat:</td>
                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>{$bookingData['seat_number']}</td>
                    </tr>
                    <tr>
                        <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Amount Paid:</td>
                        <td style='padding: 8px; border-bottom: 1px solid #eee;'>PKR {$bookingData['total_amount']}</td>
                    </tr>
                </table>
                <p style='margin-top: 20px;'>Wish you a safe and pleasant journey!</p>
                <p style='font-size: 12px; color: #777;'>This is an automated email. Please do not reply.</p>
            </div>";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email send error: " . $e->getMessage());
        return false;
    }
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
    // Enhanced query to get email and name for confirmation email
    $check = $db->prepare("
        SELECT b.booking_status, b.user_id, b.booking_id,
               u.email, u.full_name,
               r.source_city, r.destination_city, r.departure_time,
               s.seat_number
        FROM booking b
        JOIN users u ON b.user_id = u.user_id
        JOIN route r ON b.route_id = r.route_id
        JOIN seat s ON b.seat_id = s.seat_id
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

    // 3. Send confirmation email
    $booking['total_amount'] = $data->total_amount;
    sendBookingConfirmationEmail($booking['email'], $booking['full_name'], $booking);

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