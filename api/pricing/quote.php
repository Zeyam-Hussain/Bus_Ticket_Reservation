<?php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';
include_once '../../config/pricing.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$routeIds = $data['route_ids'] ?? null;
if (!is_array($routeIds) || count($routeIds) < 1 || count($routeIds) > 50) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "route_ids must contain between 1 and 50 route IDs."]);
    exit();
}

$routeIds = array_values(array_unique($routeIds));
foreach ($routeIds as $routeId) {
    if (filter_var($routeId, FILTER_VALIDATE_INT) === false || (int) $routeId < 1) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Each route ID must be a positive integer."]);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    $quotes = [];
    foreach ($routeIds as $routeId) {
        $quote = pricing_ensure_quote($db, (int) $decoded_user['user_id'], (int) $routeId);
        if ($quote === null) {
            throw new Exception("One or more selected routes are no longer available.", 409);
        }
        $quotes[(string) $routeId] = $quote;
    }
    $db->commit();

    echo json_encode(["status" => "success", "data" => (object) $quotes]);
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    $errorCode = (int) $error->getCode();
    $status = $errorCode >= 400 && $errorCode < 600 ? $errorCode : 500;
    if ($status === 500) {
        error_log("Pricing quote error: " . $error->getMessage());
    }
    http_response_code($status);
    echo json_encode([
        "status" => "error",
        "message" => $status === 500 ? "Could not load current fares." : $error->getMessage(),
    ]);
}
