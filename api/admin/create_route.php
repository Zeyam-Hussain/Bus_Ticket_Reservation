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

// FIX: Validate datetime (flexible format)
$departure_ts = strtotime($data->departure_time);
$arrival_ts   = strtotime($data->arrival_time);

if (!$departure_ts || !$arrival_ts) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid date/time format. Please use YYYY-MM-DD HH:MM:SS."]);
    exit();
}

if ($arrival_ts <= $departure_ts) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Arrival time must be after departure time."]);
    exit();
}

// Convert back to standard SQL format to be sure
$data->departure_time = date('Y-m-d H:i:s', $departure_ts);
$data->arrival_time   = date('Y-m-d H:i:s', $arrival_ts);

// FIX: Validate fare
if (!is_numeric($data->base_fare) || $data->base_fare <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "base_fare must be a positive number."]);
    exit();
}

try {
    // Verify bus exists
    $bus_check = $db->prepare("SELECT bus_id FROM bus WHERE bus_id = :bus_id LIMIT 1");
    $bus_check->bindValue(':bus_id', $data->bus_id);
    $bus_check->execute();

    if ($bus_check->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Bus not found."]);
        exit();
    }

    $stmt = $db->prepare("
        INSERT INTO route (bus_id, source_city, destination_city, departure_time, arrival_time, base_fare, status)
        VALUES (:bus_id, :source, :destination, :departure, :arrival, :fare, 'active')
    ");
    
    $stmt->bindValue(':bus_id',      $data->bus_id);
    $stmt->bindValue(':source',      htmlspecialchars(strip_tags($data->source_city)));
    $stmt->bindValue(':destination', htmlspecialchars(strip_tags($data->destination_city)));
    $stmt->bindValue(':departure',   $data->departure_time);
    $stmt->bindValue(':arrival',     $data->arrival_time);
    $stmt->bindValue(':fare',        $data->base_fare);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status"   => "success",
            "message"  => "Route created successfully.",
            "route_id" => $db->lastInsertId()
        ]);
    } else {
        throw new Exception("Database insert failed.");
    }

} catch (PDOException $e) {
    error_log("Create route PDO error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Throwable $e) {
    error_log("Create route error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
