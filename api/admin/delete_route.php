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
    // Check if route exists
    $check = $db->prepare("SELECT route_id FROM route WHERE route_id = :route_id LIMIT 1");
    $check->bindParam(':route_id', $data->route_id);
    $check->execute();

    if ($check->rowCount() === 0) {
        throw new Exception("Route not found.", 404);
    }

    $stmt = $db->prepare("DELETE FROM route WHERE route_id = :route_id");
    $stmt->bindParam(':route_id', $data->route_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Route deleted successfully."]);
    } else {
        throw new Exception("Delete failed.", 500);
    }

} catch (PDOException $e) {
    error_log("Delete route PDO constraint error: " . $e->getMessage());
    if ($e->getCode() == 23000 || $e->getCode() == '23000') {
         http_response_code(409);
         echo json_encode(["status" => "error", "message" => "Cannot delete this route because it is linked to existing bookings."]);
    } else {
         http_response_code(500);
         echo json_encode(["status" => "error", "message" => "Database error while deleting route."]);
    }
} catch (Exception $e) {
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Delete route error: " . $e->getMessage());
    $safe = in_array($code, [400, 404, 409]) ? $e->getMessage() : "Server error. Could not delete route.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
