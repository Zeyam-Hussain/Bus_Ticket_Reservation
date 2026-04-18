<?php
// api/admin/get_all_routes.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

try {
    $stmt = $db->prepare("
        SELECT 
            r.route_id, 
            r.bus_id, 
            b.registration_number, 
            b.bus_type,
            r.source_city, 
            r.destination_city, 
            r.departure_time, 
            r.arrival_time, 
            r.base_fare
        FROM route r
        LEFT JOIN bus b ON r.bus_id = b.bus_id
        ORDER BY r.departure_time DESC
    ");
    
    $stmt->execute();
    $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "total"  => count($routes),
        "data"   => $routes
    ]);

} catch (Exception $e) {
    error_log("Get all routes error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch routes."]);
}
?>
