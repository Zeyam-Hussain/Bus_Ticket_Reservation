<?php
// api/admin/delete_route.php

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

if (empty($data->route_id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "route_id is required."]);
    exit();
}

try {
    // 1. Fetch route details first to check date and bookings
    $route_check = $db->prepare("SELECT departure_time FROM route WHERE route_id = :route_id LIMIT 1");
    $route_check->bindParam(':route_id', $data->route_id);
    $route_check->execute();
    $route_info = $route_check->fetch(PDO::FETCH_ASSOC);

    if (!$route_info) {
        throw new Exception("Route not found.", 404);
    }

    $departure_time = $route_info['departure_time'];
    $is_upcoming = strtotime($departure_time) >= time();

    // Check if there are bookings
    $booking_count_stmt = $db->prepare("SELECT COUNT(*) FROM booking WHERE route_id = :route_id");
    $booking_count_stmt->bindParam(':route_id', $data->route_id);
    $booking_count_stmt->execute();
    $booking_count = $booking_count_stmt->fetchColumn();

    // 2. If upcoming and has bookings, require password
    if ($is_upcoming && $booking_count > 0) {
        if (empty($data->admin_password)) {
            http_response_code(403);
            echo json_encode([
                "status" => "error", 
                "requires_password" => true,
                "message" => "This is an upcoming route with active bookings. Please provide your admin password to confirm deletion."
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

    // 1. Delete seat_locks associated with this route
    $stmt = $db->prepare("DELETE FROM seat_locks WHERE route_id = :route_id");
    $stmt->bindParam(':route_id', $data->route_id);
    $stmt->execute();

    // 2. Find bookings associated with this route to delete their payments
    $stmt = $db->prepare("SELECT booking_id FROM booking WHERE route_id = :route_id");
    $stmt->bindParam(':route_id', $data->route_id);
    $stmt->execute();
    $booking_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($booking_ids)) {
        $inQuery = implode(',', array_fill(0, count($booking_ids), '?'));
        
        // 3. Delete payments
        $stmt = $db->prepare("DELETE FROM payment WHERE booking_id IN ($inQuery)");
        $stmt->execute($booking_ids);
        
        // 4. Delete bookings
        $stmt = $db->prepare("DELETE FROM booking WHERE booking_id IN ($inQuery)");
        $stmt->execute($booking_ids);
    }

    // 5. Finally delete the route
    $stmt = $db->prepare("DELETE FROM route WHERE route_id = :route_id");
    $stmt->bindParam(':route_id', $data->route_id);

    if ($stmt->execute()) {
        $db->commit();
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Route and all associated bookings deleted successfully."]);
    } else {
        throw new Exception("Delete failed.", 500);
    }

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log("Delete route PDO error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error while deleting route: " . $e->getMessage()]);
} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Delete route error: " . $e->getMessage());
    $safe = in_array($code, [400, 404, 409]) ? $e->getMessage() : "Server error. Could not delete route.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
