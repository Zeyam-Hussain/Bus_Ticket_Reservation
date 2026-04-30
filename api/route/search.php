<?php
// api/route/search.php

include_once '../../config/core.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

$source      = isset($_GET['source'])      ? htmlspecialchars(strip_tags($_GET['source']))      : '';
$destination = isset($_GET['destination']) ? htmlspecialchars(strip_tags($_GET['destination'])) : '';

try {
    $stmt = $db->prepare("
        SELECT * FROM active_routes_view
        WHERE source_city      LIKE :source
          AND destination_city LIKE :destination
        ORDER BY departure_time ASC
    ");
    $stmt->bindValue(':source',      "%$source%");
    $stmt->bindValue(':destination', "%$destination%");
    $stmt->execute();

    $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($routes) > 0) {
        http_response_code(200);
        echo json_encode([
            "status"  => "success",
            "results" => count($routes),
            "data"    => $routes
        ]);
    } else {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "No routes found.", "data" => []]);
    }

} catch (Throwable $e) {
    error_log("Search error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Search failed. Please try again."]);
}
?>
