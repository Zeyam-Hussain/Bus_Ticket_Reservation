<?php
// api/buses/getBuses.php
// FIX: Complete rewrite — was using mysqli $conn which doesn't exist in this project.
// FIX: Now uses PDO via the Database class, consistent with all other files.
// FIX: Queries the correct table name 'bus' (not 'buses').
// FIX: Removed duplicate <?php opening tag.

include_once '../../config/core.php';
include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

try {
    $stmt = $db->query("
        SELECT
            bus_id,
            bus_type,
            registration_number,
            total_capacity
        FROM bus
        ORDER BY bus_id ASC
    ");

    $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "total"  => count($buses),
        "data"   => $buses
    ]);

} catch (Throwable $e) {
    error_log("Get buses error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch buses."]);
}
?>
