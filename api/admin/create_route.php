<?php
// api/admin/create_route.php
// FIX: Added authentication and admin role check — was fully open before.
// FIX: Added datetime format validation and fare validation.

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

// FIX: Admin only
if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"));

if (
    empty($data->bus_id)           ||
    empty($data->source_city)      ||
    empty($data->destination_city) ||
    empty($data->departure_time)   ||
    empty($data->arrival_time)     ||
    !isset($data->base_fare)
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "All route fields are required."]);
    exit();
}

// FIX: Validate datetime format (expected: YYYY-MM-DD HH:MM:SS)
$departure = DateTime::createFromFormat('Y-m-d H:i:s', $data->departure_time);
$arrival   = DateTime::createFromFormat('Y-m-d H:i:s', $data->arrival_time);

if (!$departure || !$arrival) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid datetime format. Use YYYY-MM-DD HH:MM:SS."]);
    exit();
}

if ($arrival <= $departure) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Arrival time must be after departure time."]);
    exit();
}

// FIX: Validate fare
if (!is_numeric($data->base_fare) || $data->base_fare <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "base_fare must be a positive number."]);
    exit();
}

try {
    // Verify bus exists
    $bus_check = $db->prepare("SELECT bus_id FROM bus WHERE bus_id = :bus_id LIMIT 1");
    $bus_check->bindParam(':bus_id', $data->bus_id);
    $bus_check->execute();

    if ($bus_check->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Bus not found."]);
        exit();
    }

    $stmt = $db->prepare("
        INSERT INTO route (bus_id, source_city, destination_city, departure_time, arrival_time, base_fare)
        VALUES (:bus_id, :source, :destination, :departure, :arrival, :fare)
    ");
    $stmt->bindParam(':bus_id',      $data->bus_id);
    $stmt->bindValue(':source',      htmlspecialchars(strip_tags($data->source_city)));
    $stmt->bindValue(':destination', htmlspecialchars(strip_tags($data->destination_city)));
    $stmt->bindParam(':departure',   $data->departure_time);
    $stmt->bindParam(':arrival',     $data->arrival_time);
    $stmt->bindParam(':fare',        $data->base_fare);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status"   => "success",
            "message"  => "Route created successfully.",
            "route_id" => $db->lastInsertId()
        ]);
    } else {
        throw new Exception("Insert failed.");
    }

} catch (Throwable $e) {
    error_log("Create route error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Server error. Could not create route."]);
}
?>
