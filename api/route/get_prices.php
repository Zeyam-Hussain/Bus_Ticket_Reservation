<?php
// api/route/get_prices.php

include_once '../../config/core.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

// We want to fetch the minimum fare for a set of predefined routes
$target_routes = [
    ['from' => 'Lahore', 'to' => 'Karachi'],
    ['from' => 'Islamabad', 'to' => 'Lahore'],
    ['from' => 'Peshawar', 'to' => 'Islamabad'],
    ['from' => 'Karachi', 'to' => 'Peshawar']
];

$results = [];

try {
    foreach ($target_routes as $route) {
        $stmt = $db->prepare("
            SELECT MIN(base_fare) as min_fare 
            FROM route 
            WHERE source_city = :source 
              AND destination_city = :destination
              AND departure_time > NOW()
        ");
        $stmt->bindParam(':source', $route['from']);
        $stmt->bindParam(':destination', $route['to']);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $fare = $row['min_fare'];
        
        $results[] = [
            "from" => $route['from'],
            "to" => $route['to'],
            "price" => $fare ? "PKR " . number_format($fare) : "no operation"
        ];
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $results
    ]);

} catch (Exception $e) {
    error_log("Get prices error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch prices."]);
}
?>
