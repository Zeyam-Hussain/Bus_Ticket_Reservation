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
    // Check if bus exists
    $check = $db->prepare("SELECT bus_id FROM bus WHERE bus_id = :bus_id LIMIT 1");
    $check->bindParam(':bus_id', $data->bus_id);
    $check->execute();

    if ($check->rowCount() === 0) {
        throw new Exception("Bus not found.", 404);
    }

    $stmt = $db->prepare("DELETE FROM bus WHERE bus_id = :bus_id");
    $stmt->bindParam(':bus_id', $data->bus_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Bus deleted successfully."]);
    } else {
        throw new Exception("Delete failed. It may be referenced by existing routes.", 500);
    }

} catch (PDOException $e) {
    error_log("Delete bus PDO constraint error: " . $e->getMessage());
    // Error 23000 is Integrity constraint violation (Foreign Key reference)
    if ($e->getCode() == 23000 || $e->getCode() == '23000') {
         http_response_code(409);
         echo json_encode(["status" => "error", "message" => "Cannot delete this bus because it is linked to one or more routes."]);
    } else {
         http_response_code(500);
         echo json_encode(["status" => "error", "message" => "Database error while deleting bus."]);
    }
} catch (Exception $e) {
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Delete bus error: " . $e->getMessage());
    $safe = in_array($code, [400, 404, 409]) ? $e->getMessage() : "Server error. Could not delete bus.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
