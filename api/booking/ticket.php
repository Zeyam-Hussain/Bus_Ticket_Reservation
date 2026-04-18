<?php
// api/booking/ticket.php
// FIX: Added authentication — no more open access to any user's tickets.
// FIX: user_id comes from JWT token, not the URL parameter (prevents data theft).

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// FIX: Use the authenticated user's ID from the token, not from $_GET
$user_id = $decoded_user['user_id'];

try {
    $query = "
        SELECT
            b.booking_id,
            b.booking_date,
            b.booking_status,
            b.passenger_gender,
            s.seat_number,
            r.source_city,
            r.destination_city,
            r.departure_time,
            r.arrival_time,
            r.base_fare,
            bs.bus_type,
            bs.registration_number,
            p.total_amount,
            p.payment_method,
            p.transaction_status
        FROM booking b
        INNER JOIN route r  ON b.route_id = r.route_id
        INNER JOIN bus bs   ON r.bus_id   = bs.bus_id
        INNER JOIN seat s   ON b.seat_id  = s.seat_id
        LEFT JOIN  payment p ON b.booking_id = p.booking_id
        WHERE b.user_id = :user_id
        ORDER BY b.booking_date DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($tickets) > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $tickets]);
    } else {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "No bookings found.", "data" => []]);
    }

} catch (Throwable $e) {
    error_log("Ticket fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch tickets."]);
}
?>