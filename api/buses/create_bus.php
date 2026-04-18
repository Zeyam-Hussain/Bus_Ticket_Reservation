<?php
// api/buses/create_bus.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
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

if (
    empty($data->bus_type) ||
    empty($data->registration_number) ||
    empty($data->total_capacity)
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "bus_type, registration_number, and total_capacity are required."]);
    exit();
}

if (!is_numeric($data->total_capacity) || $data->total_capacity <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "total_capacity must be a positive number."]);
    exit();
}

try {
    // Check if registration number already exists
    $check = $db->prepare("SELECT bus_id FROM bus WHERE registration_number = :reg_num LIMIT 1");
    $check->bindParam(':reg_num', $data->registration_number);
    $check->execute();

    if ($check->rowCount() > 0) {
        throw new Exception("A bus with this registration number already exists.", 409);
    }

    $stmt = $db->prepare("
        INSERT INTO bus (bus_type, registration_number, total_capacity)
        VALUES (:bus_type, :registration_number, :total_capacity)
    ");

    $stmt->bindValue(':bus_type', htmlspecialchars(strip_tags($data->bus_type)));
    $stmt->bindValue(':registration_number', htmlspecialchars(strip_tags($data->registration_number)));
    $stmt->bindParam(':total_capacity', $data->total_capacity);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "Bus created successfully.",
            "bus_id" => $db->lastInsertId()
        ]);
    } else {
        throw new Exception("Insert failed.", 500);
    }

} catch (Throwable $e) {
    $code = ($e->getCode() >= 400 && $e->getCode() < 600 && is_numeric($e->getCode())) ? $e->getCode() : 500;
    error_log("Create bus error: " . $e->getMessage());
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
