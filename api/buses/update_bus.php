<?php
// api/buses/update_bus.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use PUT method."]);
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

    $update_query = "UPDATE bus SET ";
    $update_fields = [];
    $params = [':bus_id' => $data->bus_id];

    if (!empty($data->bus_type)) {
        $update_fields[] = "bus_type = :bus_type";
        $params[':bus_type'] = htmlspecialchars(strip_tags($data->bus_type));
    }

    if (!empty($data->registration_number)) {
        $update_fields[] = "registration_number = :registration_number";
        $params[':registration_number'] = htmlspecialchars(strip_tags($data->registration_number));
        
        // Ensure new registration number does not already exist on another bus
        $check_reg = $db->prepare("SELECT bus_id FROM bus WHERE registration_number = :reg_num AND bus_id != :bus_id LIMIT 1");
        $check_reg->bindParam(':reg_num', $data->registration_number);
        $check_reg->bindParam(':bus_id', $data->bus_id);
        $check_reg->execute();
        
        if ($check_reg->rowCount() > 0) {
            throw new Exception("Another bus with this registration number already exists.", 409);
        }
    }

    if (isset($data->total_capacity)) {
        if (!is_numeric($data->total_capacity) || $data->total_capacity <= 0) {
            throw new Exception("total_capacity must be a positive number.", 400);
        }
        $update_fields[] = "total_capacity = :total_capacity";
        $params[':total_capacity'] = $data->total_capacity;
    }

    if (empty($update_fields)) {
        throw new Exception("No fields to update provided.", 400);
    }

    $update_query .= implode(", ", $update_fields) . " WHERE bus_id = :bus_id";

    $stmt = $db->prepare($update_query);
    
    foreach ($params as $param => $value) {
        $stmt->bindValue($param, $value);
    }

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Bus updated successfully."]);
    } else {
        throw new Exception("Update failed.", 500);
    }

} catch (Exception $e) {
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Update bus error: " . $e->getMessage());
    $safe = in_array($code, [400, 404, 409]) ? $e->getMessage() : "Server error. Could not update bus.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
