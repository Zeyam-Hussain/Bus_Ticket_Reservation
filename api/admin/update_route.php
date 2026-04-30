<?php
// api/admin/update_route.php

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

    $update_query = "UPDATE route SET ";
    $update_fields = [];
    $params = [':route_id' => $data->route_id];

    if (!empty($data->bus_id)) {
        // Verify new bus exists
        $bus_check = $db->prepare("SELECT bus_id FROM bus WHERE bus_id = :bus_id LIMIT 1");
        $bus_check->bindParam(':bus_id', $data->bus_id);
        $bus_check->execute();
        if ($bus_check->rowCount() === 0) {
            throw new Exception("Provided bus_id does not exist.", 404);
        }
        $update_fields[] = "bus_id = :bus_id";
        $params[':bus_id'] = $data->bus_id;
    }

    if (!empty($data->source_city)) {
        $update_fields[] = "source_city = :source_city";
        $params[':source_city'] = htmlspecialchars(strip_tags($data->source_city));
    }

    if (!empty($data->destination_city)) {
        $update_fields[] = "destination_city = :destination_city";
        $params[':destination_city'] = htmlspecialchars(strip_tags($data->destination_city));
    }

    if (!empty($data->departure_time)) {
        $ts = strtotime($data->departure_time);
        if (!$ts) {
            throw new Exception("Invalid departure time format. Please use YYYY-MM-DD HH:MM:SS.", 400);
        }
        $update_fields[] = "departure_time = :departure_time";
        $params[':departure_time'] = date('Y-m-d H:i:s', $ts);
    }

    if (!empty($data->arrival_time)) {
        $ts = strtotime($data->arrival_time);
        if (!$ts) {
            throw new Exception("Invalid arrival time format. Please use YYYY-MM-DD HH:MM:SS.", 400);
        }
        $update_fields[] = "arrival_time = :arrival_time";
        $params[':arrival_time'] = date('Y-m-d H:i:s', $ts);
    }
    


    if (isset($data->base_fare)) {
        if (!is_numeric($data->base_fare) || $data->base_fare <= 0) {
            throw new Exception("base_fare must be a positive number.", 400);
        }
        $update_fields[] = "base_fare = :base_fare";
        $params[':base_fare'] = $data->base_fare;
    }

    if (empty($update_fields)) {
        throw new Exception("No fields to update provided.", 400);
    }

    $update_query .= implode(", ", $update_fields) . " WHERE route_id = :route_id";

    $stmt = $db->prepare($update_query);
    
    foreach ($params as $param => $value) {
        $stmt->bindValue($param, $value);
    }

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Route updated successfully."]);
    } else {
        throw new Exception("Update failed.", 500);
    }

} catch (Exception $e) {
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    error_log("Update route error: " . $e->getMessage());
    $safe = in_array($code, [400, 404, 409]) ? $e->getMessage() : "Server error. Could not update route.";
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $safe]);
}
?>
