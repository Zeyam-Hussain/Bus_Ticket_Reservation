<?php
// api/admin/delete_old_data.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

// Admin only
if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

$database = new Database();
$db       = $database->getConnection();

try {
    $db->beginTransaction();

    $delete_all = isset($data->delete_all) ? $data->delete_all : false;
    
    $route_ids = [];
    $booking_ids = [];
    $bus_ids = [];

    if ($delete_all) {
        $routes_stmt = $db->query("SELECT route_id FROM route WHERE departure_time < DATE_SUB(NOW(), INTERVAL 2 YEAR)");
        $route_ids = $routes_stmt->fetchAll(PDO::FETCH_COLUMN);

        $bookings_stmt = $db->query("SELECT booking_id FROM booking WHERE booking_date < DATE_SUB(NOW(), INTERVAL 2 YEAR)");
        $booking_ids = $bookings_stmt->fetchAll(PDO::FETCH_COLUMN);

        $buses_stmt = $db->query("SELECT bus_id FROM bus WHERE created_at < DATE_SUB(NOW(), INTERVAL 2 YEAR)");
        $bus_ids = $buses_stmt->fetchAll(PDO::FETCH_COLUMN);
    } else {
        $route_ids = $data->route_ids ?? [];
        $booking_ids = $data->booking_ids ?? [];
        $bus_ids = $data->bus_ids ?? [];
    }

    // Prepare to gather all dependent IDs
    if (!empty($bus_ids)) {
        $bus_ids = array_values(array_unique($bus_ids));
        $inQuery = implode(',', array_fill(0, count($bus_ids), '?'));
        $stmt = $db->prepare("SELECT route_id FROM route WHERE bus_id IN ($inQuery)");
        $stmt->execute($bus_ids);
        $bus_route_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($bus_route_ids)) {
            $route_ids = array_merge($route_ids, $bus_route_ids);
        }
    }

    if (!empty($route_ids)) {
        $route_ids = array_values(array_unique($route_ids));
        $inQuery = implode(',', array_fill(0, count($route_ids), '?'));
        $stmt = $db->prepare("SELECT booking_id FROM booking WHERE route_id IN ($inQuery)");
        $stmt->execute($route_ids);
        $route_booking_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $booking_ids = array_merge($booking_ids, $route_booking_ids);
    }
    
    // Now delete in correct order: Payments -> Bookings -> Routes -> Seats -> Buses
    
    if (!empty($booking_ids)) {
        $booking_ids = array_values(array_unique($booking_ids));
        $inQuery = implode(',', array_fill(0, count($booking_ids), '?'));
        $stmt = $db->prepare("DELETE FROM payment WHERE booking_id IN ($inQuery)");
        $stmt->execute($booking_ids);
        
        $stmt = $db->prepare("DELETE FROM booking WHERE booking_id IN ($inQuery)");
        $stmt->execute($booking_ids);
    }
    
    if (!empty($route_ids)) {
        $route_ids = array_values(array_unique($route_ids));
        $inQuery = implode(',', array_fill(0, count($route_ids), '?'));
        
        // Delete seat_locks first
        $stmt = $db->prepare("DELETE FROM seat_locks WHERE route_id IN ($inQuery)");
        $stmt->execute($route_ids);

        // Then delete routes
        $stmt = $db->prepare("DELETE FROM route WHERE route_id IN ($inQuery)");
        $stmt->execute($route_ids);
    }
    
    if (!empty($bus_ids)) {
        $bus_ids = array_values(array_unique($bus_ids));
        $inQuery = implode(',', array_fill(0, count($bus_ids), '?'));
        
        $stmt = $db->prepare("DELETE FROM seat WHERE bus_id IN ($inQuery)");
        $stmt->execute($bus_ids);
        
        $stmt = $db->prepare("DELETE FROM bus WHERE bus_id IN ($inQuery)");
        $stmt->execute($bus_ids);
    }

    $db->commit();

    http_response_code(200);
    echo json_encode([
        "status" => "success", 
        "message" => "Old data successfully deleted.",
        "deleted" => [
            "buses" => count($bus_ids),
            "routes" => count($route_ids),
            "bookings" => count($booking_ids)
        ]
    ]);

} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Delete old data error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to delete old data. " . $e->getMessage()]);
}
?>
