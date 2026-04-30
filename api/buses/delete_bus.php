<?php
// api/buses/delete_bus.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use DELETE method."]);
    exit();
}

if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"));

if (empty($data->bus_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "bus_id is required."]);
    exit();
}

try {
    // 1. Check if any associated route is upcoming and has bookings
    $check_stmt = $db->prepare("
        SELECT COUNT(*) FROM route r
        JOIN booking b ON r.route_id = b.route_id
        WHERE r.bus_id = :bus_id AND r.departure_time >= NOW()
    ");
    $check_stmt->bindParam(':bus_id', $data->bus_id);
    $check_stmt->execute();
    $upcoming_bookings = $check_stmt->fetchColumn();

    if ($upcoming_bookings > 0) {
        if (empty($data->admin_password)) {
            http_response_code(403);
            echo json_encode([
                "status" => "error", 
                "requires_password" => true,
                "message" => "This bus has upcoming routes with active bookings. Please provide your admin password to confirm deletion of the bus and all associated data."
            ]);
            exit();
        }

        // Verify password
        $user_id = $decoded_user['user_id'];
        $pass_stmt = $db->prepare("SELECT password FROM users WHERE user_id = :user_id LIMIT 1");
        $pass_stmt->bindParam(':user_id', $user_id);
        $pass_stmt->execute();
        $user_data = $pass_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user_data || !password_verify($data->admin_password, $user_data['password'])) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid admin password. Deletion denied."]);
            exit();
        }
    }

    $db->beginTransaction();

    // Check if bus exists
    $check = $db->prepare("SELECT bus_id FROM bus WHERE bus_id = :bus_id LIMIT 1");
    $check->bindParam(':bus_id', $data->bus_id);
    $check->execute();

    if ($check->rowCount() === 0) {
        throw new Exception("Bus not found.", 404);
    }

    // 1. Get all routes for this bus to find their bookings
    $stmt = $db->prepare("SELECT route_id FROM route WHERE bus_id = :bus_id");
    $stmt->bindParam(':bus_id', $data->bus_id);
    $stmt->execute();
    $route_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($route_ids)) {
        $routeInQuery = implode(',', array_fill(0, count($route_ids), '?'));

        // 2. Delete seat_locks for these routes
        $stmt = $db->prepare("DELETE FROM seat_locks WHERE route_id IN ($routeInQuery)");
        $stmt->execute($route_ids);

        // 3. Find bookings for these routes
        $stmt = $db->prepare("SELECT booking_id FROM booking WHERE route_id IN ($routeInQuery)");
        $stmt->execute($route_ids);
        $booking_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (!empty($booking_ids)) {
            $bookingInQuery = implode(',', array_fill(0, count($booking_ids), '?'));

            // 4. Delete payments
            $stmt = $db->prepare("DELETE FROM payment WHERE booking_id IN ($bookingInQuery)");
            $stmt->execute($booking_ids);

            // 5. Delete bookings
            $stmt = $db->prepare("DELETE FROM booking WHERE booking_id IN ($bookingInQuery)");
            $stmt->execute($booking_ids);
        }

        // 6. Delete routes
        $stmt = $db->prepare("DELETE FROM route WHERE route_id IN ($routeInQuery)");
        $stmt->execute($route_ids);
    }

    // 7. Delete seats for this bus
    $stmt = $db->prepare("DELETE FROM seat WHERE bus_id = :bus_id");
    $stmt->bindParam(':bus_id', $data->bus_id);
    $stmt->execute();

    // 8. Finally delete the bus
    $stmt = $db->prepare("DELETE FROM bus WHERE bus_id = :bus_id");
    $stmt->bindParam(':bus_id', $data->bus_id);

    if ($stmt->execute()) {
        $db->commit();
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Bus and all associated routes/bookings deleted successfully."]);
    } else {
        throw new Exception("Delete failed.", 500);
    }

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log("Delete bus PDO error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error while deleting bus: " . $e->getMessage()]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Delete bus error: " . $e->getMessage());
    $safe = in_array($code, [400, 404, 409]) ? $e->getMessage() : "Server error. Could not delete bus.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
