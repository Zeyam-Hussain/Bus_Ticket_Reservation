<?php
// api/route/seats.php
// FIX: Safe error messages — internal details no longer exposed.

include_once '../../config/core.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

if (empty($_GET['route_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "route_id is required."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$route_id = intval($_GET['route_id']);

try {
    $stmt = $db->prepare("
        SELECT
            s.seat_id,
            s.seat_number,
            CASE
                WHEN b.booking_id IS NULL         THEN 'available'
                WHEN b.passenger_gender = 'Male'  THEN 'booked_male'
                WHEN b.passenger_gender = 'Female' THEN 'booked_female'
                ELSE 'booked'
            END AS current_status
        FROM seat s
        JOIN route r ON s.bus_id = r.bus_id
        LEFT JOIN booking b
            ON s.seat_id     = b.seat_id
            AND b.route_id   = r.route_id
            AND b.booking_status = 'confirmed'
        WHERE r.route_id = :route_id
        ORDER BY s.seat_id ASC
    ");
    $stmt->bindParam(':route_id', $route_id, PDO::PARAM_INT);
    $stmt->execute();

    $seats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($seats) > 0) {
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $seats]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "No seats found for this route."]);
    }

} catch (Throwable $e) {
    error_log("Seats fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch seats."]);
}
?>
