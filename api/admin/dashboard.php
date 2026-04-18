<?php
// api/admin/dashboard.php
// FIX: Added authentication and admin role check — was fully public before.
// FIX: Safe error messages.

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use GET method."]);
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

try {
    $response = [];

    // 1. Overall KPIs
    $kpi_stmt = $db->query("
        SELECT
            (SELECT COUNT(*) FROM booking WHERE booking_status = 'confirmed') AS total_bookings,
            (SELECT COALESCE(SUM(total_amount), 0) FROM payment WHERE transaction_status = 'completed') AS total_revenue,
            (SELECT COUNT(*) FROM bus) AS total_buses,
            (SELECT COUNT(*) FROM users WHERE role = 'passenger') AS total_customers
    ");
    $response['kpis'] = $kpi_stmt->fetch(PDO::FETCH_ASSOC);

    // 2. Month-over-month growth
    $mom_stmt = $db->query("
        SELECT
            SUM(CASE WHEN MONTH(b.booking_date) = MONTH(CURRENT_DATE()) AND YEAR(b.booking_date) = YEAR(CURRENT_DATE()) THEN p.total_amount ELSE 0 END) AS this_month_revenue,
            SUM(CASE WHEN MONTH(b.booking_date) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(b.booking_date) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) THEN p.total_amount ELSE 0 END) AS last_month_revenue,
            COUNT(DISTINCT CASE WHEN MONTH(b.booking_date) = MONTH(CURRENT_DATE()) THEN b.user_id END) AS this_month_unique_customers,
            COUNT(DISTINCT CASE WHEN MONTH(b.booking_date) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) THEN b.user_id END) AS last_month_unique_customers
        FROM booking b
        LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.transaction_status = 'completed'
        WHERE b.booking_status = 'confirmed'
    ");
    $mom = $mom_stmt->fetch(PDO::FETCH_ASSOC);

    $revenue_growth = ($mom['last_month_revenue'] > 0)
        ? (($mom['this_month_revenue'] - $mom['last_month_revenue']) / $mom['last_month_revenue']) * 100
        : ($mom['this_month_revenue'] > 0 ? 100 : 0);

    $response['growth'] = [
        "this_month_revenue"       => $mom['this_month_revenue']          ?? 0,
        "last_month_revenue"       => $mom['last_month_revenue']          ?? 0,
        "revenue_growth_percentage"=> round($revenue_growth, 2),
        "this_month_customers"     => $mom['this_month_unique_customers']  ?? 0,
        "last_month_customers"     => $mom['last_month_unique_customers']  ?? 0
    ];

    // 3. Last 6 months chart data
    $chart_stmt = $db->query("
        SELECT
            DATE_FORMAT(b.booking_date, '%Y-%m') AS month_year,
            DATE_FORMAT(b.booking_date, '%b %Y') AS month_name,
            COUNT(b.booking_id) AS tickets_sold,
            COALESCE(SUM(p.total_amount), 0) AS monthly_revenue
        FROM booking b
        LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.transaction_status = 'completed'
        WHERE b.booking_status = 'confirmed'
          AND b.booking_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        GROUP BY month_year, month_name
        ORDER BY month_year ASC
    ");
    $response['chart_data'] = $chart_stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Top performing routes
    $top_stmt = $db->query("
        SELECT
            r.source_city,
            r.destination_city,
            COUNT(b.booking_id) AS total_bookings
        FROM booking b
        JOIN route r ON b.route_id = r.route_id
        WHERE b.booking_status = 'confirmed'
        GROUP BY r.route_id, r.source_city, r.destination_city
        ORDER BY total_bookings DESC
        LIMIT 4
    ");
    $response['top_routes'] = $top_stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(["status" => "success", "data" => $response]);

} catch (Throwable $e) {
    error_log("Dashboard error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to load dashboard data."]);
}
?>
