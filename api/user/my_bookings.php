<?php
// api/user/my_bookings.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

try {
    $database = new Database();
    $db       = $database->getConnection();

    if (!isset($decoded_user['user_id'])) {
        throw new Exception("Invalid token payload.", 400);
    }

    $user_id = $decoded_user['user_id'];

    $query = "
        SELECT
            b.booking_id,
            b.seat_id,
            b.passenger_gender,
            u.full_name AS passenger_name,
            b.booking_status,
            b.booking_date,
            r.source_city,
            r.destination_city,
            r.departure_time,
            r.arrival_time,
            r.base_fare,
            s.seat_number,
            p.total_amount,
            p.payment_method,
            p.transaction_status,
            bs.bus_type,
            bs.registration_number
        FROM booking b
        INNER JOIN users u  ON b.user_id = u.user_id
        LEFT JOIN payment p ON b.booking_id = p.booking_id
        LEFT JOIN route r   ON b.route_id   = r.route_id
        LEFT JOIN bus bs    ON r.bus_id     = bs.bus_id
        LEFT JOIN seat s    ON b.seat_id     = s.seat_id
        WHERE b.user_id = :user_id
        ORDER BY b.booking_id DESC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);


    http_response_code(200);
    echo json_encode([
        "status"        => "success",
        "total_tickets" => count($bookings),
        "data"          => $bookings
    ]);

} catch (Throwable $e) {
    error_log("My bookings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch bookings."]);
}
?>
