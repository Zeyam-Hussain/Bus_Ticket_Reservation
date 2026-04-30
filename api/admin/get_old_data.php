<?php
// api/admin/get_old_data.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

// Admin only
if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

try {
    $response = [];

    // 1. Get Old Routes
    // Routes whose departure time was more than 10 days ago
    $routes_stmt = $db->query("
        SELECT route_id, source_city, destination_city, departure_time 
        FROM route 
        WHERE departure_time < DATE_SUB(NOW(), INTERVAL 10 DAY)
    ");
    $response['old_routes'] = $routes_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get Old Bookings
    // Bookings created more than 10 days ago
    $bookings_stmt = $db->query("
        SELECT b.booking_id, b.user_id, b.route_id, b.booking_date, b.booking_status
        FROM booking b
        WHERE b.booking_date < DATE_SUB(NOW(), INTERVAL 10 DAY)
    ");
    $response['old_bookings'] = $bookings_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get Old Buses
    // Buses created more than 10 days ago
    $buses_stmt = $db->query("
        SELECT bus_id, registration_number, created_at 
        FROM bus 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 10 DAY)
    ");
    $response['old_buses'] = $buses_stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "status" => "success", 
        "data" => $response,
        "counts" => [
            "routes" => count($response['old_routes']),
            "bookings" => count($response['old_bookings']),
            "buses" => count($response['old_buses'])
        ]
    ]);

} catch (Throwable $e) {
    error_log("Get old data error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch old data."]);
}
?>
