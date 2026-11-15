<?php
// api/admin/get_all_bookings.php
// Admin endpoint: lists all bookings with optional filters.
// Supports: ?status=confirmed&route_id=1&date_from=2026-04-01&date_to=2026-04-30

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
    exit();
}

if (!isset($decoded_user['role']) || $decoded_user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Admins only."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();

try {
    $conditions = ["1=1"];
    $params     = [];

    // Optional filter: booking status
    if (!empty($_GET['status']) && in_array($_GET['status'], ['confirmed','cancelled','pending'])) {
        $conditions[]         = "b.booking_status = :status";
        $params[':status']    = $_GET['status'];
    }

    // Optional filter: route
    if (!empty($_GET['route_id']) && is_numeric($_GET['route_id'])) {
        $conditions[]          = "b.route_id = :route_id";
        $params[':route_id']   = (int) $_GET['route_id'];
    }

    // Optional filter: date range
    if (!empty($_GET['date_from'])) {
        $conditions[]           = "b.booking_date >= :date_from";
        $params[':date_from']   = $_GET['date_from'] . ' 00:00:00';
    }
    if (!empty($_GET['date_to'])) {
        $conditions[]          = "b.booking_date <= :date_to";
        $params[':date_to']    = $_GET['date_to'] . ' 23:59:59';
    }

    $where = implode(' AND ', $conditions);

    $stmt = $db->prepare("
        SELECT
            b.booking_id,
            b.user_id,
            u.full_name AS passenger_name,
            u.email AS passenger_email,
            b.route_id,
            r.source_city,
            r.destination_city,
            r.departure_time,
            s.seat_number,
            b.booking_date,
            b.cancellation_date,
            b.booking_status,
            payment.total_amount,
            payment.transaction_status
        FROM booking b
        JOIN users u ON u.user_id = b.user_id
        JOIN route r ON r.route_id = b.route_id
        JOIN seat s ON s.seat_id = b.seat_id
        LEFT JOIN LATERAL (
            SELECT p.total_amount, p.transaction_status
            FROM payment p
            WHERE p.booking_id = b.booking_id
            ORDER BY p.paid_at DESC, p.payment_id DESC
            LIMIT 1
        ) payment ON TRUE
        WHERE $where
        ORDER BY b.booking_date DESC, b.booking_id DESC
    ");

    foreach ($params as $key => &$val) {
        $stmt->bindParam($key, $val);
    }
    $stmt->execute();

    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "total"   => count($bookings),
        "data"    => $bookings
    ]);

} catch (Throwable $e) {
    error_log("Get all bookings error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to fetch bookings."]);
}
?>
