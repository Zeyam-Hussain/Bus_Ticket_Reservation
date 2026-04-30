<?php
// api/admin/reports.php
// Returns aggregated report data for the admin panel.
// Query param: ?type=revenue | passengers | routes | payments | cancellations

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

$type = $_GET['type'] ?? 'revenue';

try {
    $data = [];

    switch ($type) {

        // ── Revenue by payment method ──────────────────────────────
        case 'revenue':
            $stmt = $db->query("
                SELECT
                    payment_method,
                    COUNT(*)                AS transactions,
                    SUM(total_amount)       AS total_revenue,
                    ROUND(AVG(total_amount),2) AS avg_amount,
                    MIN(total_amount)       AS min_amount,
                    MAX(total_amount)       AS max_amount
                FROM payment
                WHERE transaction_status = 'completed'
                GROUP BY payment_method
                ORDER BY total_revenue DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        // ── Bookings per route ─────────────────────────────────────
        case 'routes':
            $stmt = $db->query("SELECT * FROM revenue_by_route_view ORDER BY total_revenue DESC");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        // ── Passenger statistics ───────────────────────────────────
        case 'passengers':
            $stmt = $db->query("
                SELECT
                    u.user_id,
                    u.full_name,
                    u.email,
                    COUNT(b.booking_id)                         AS total_bookings,
                    SUM(CASE WHEN b.booking_status='confirmed'  THEN 1 ELSE 0 END) AS confirmed,
                    SUM(CASE WHEN b.booking_status='cancelled'  THEN 1 ELSE 0 END) AS cancelled,
                    COALESCE(SUM(p.total_amount), 0)            AS total_spent,
                    MAX(b.booking_date)                         AS last_booking
                FROM users u
                LEFT JOIN booking b ON u.user_id = b.user_id
                LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.transaction_status = 'completed'
                WHERE u.role = 'passenger'
                GROUP BY u.user_id, u.full_name, u.email
                ORDER BY total_spent DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        // ── Monthly booking trend ──────────────────────────────────
        case 'monthly':
            $stmt = $db->query("
                SELECT
                    DATE_FORMAT(b.booking_date, '%Y-%m')   AS month_year,
                    DATE_FORMAT(b.booking_date, '%b %Y')   AS month_label,
                    COUNT(b.booking_id)                    AS total_bookings,
                    SUM(CASE WHEN b.booking_status='confirmed' THEN 1 ELSE 0 END) AS confirmed,
                    SUM(CASE WHEN b.booking_status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
                    COALESCE(SUM(p.total_amount), 0)       AS monthly_revenue
                FROM booking b
                LEFT JOIN payment p
                       ON b.booking_id = p.booking_id
                      AND p.transaction_status = 'completed'
                GROUP BY month_year, month_label
                ORDER BY month_year ASC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        // ── Cancellation report ────────────────────────────────────
        case 'cancellations':
            $stmt = $db->query("
                SELECT
                    b.booking_id,
                    u.full_name        AS passenger,
                    r.source_city,
                    r.destination_city,
                    b.booking_date,
                    b.cancellation_date,
                    COALESCE(p.total_amount, 0) AS refund_amount,
                    p.transaction_status
                FROM booking b
                JOIN users   u ON b.user_id    = u.user_id
                JOIN route   r ON b.route_id   = r.route_id
                LEFT JOIN payment p ON b.booking_id = p.booking_id
                WHERE b.booking_status = 'cancelled'
                ORDER BY b.cancellation_date DESC
            ");
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        default:
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid report type. Use: revenue, routes, passengers, monthly, cancellations."]);
            exit();
    }

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "type"   => $type,
        "total"  => count($data),
        "data"   => $data
    ]);

} catch (Throwable $e) {
    error_log("Reports error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to generate report."]);
}
?>
