<?php
// api/admin/dashboard.php

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
            SUM(CASE
                WHEN b.booking_date >= date_trunc('month', CURRENT_DATE)
                 AND b.booking_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
                THEN p.total_amount ELSE 0
            END) AS this_month_revenue,
            SUM(CASE
                WHEN b.booking_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
                 AND b.booking_date < date_trunc('month', CURRENT_DATE)
                THEN p.total_amount ELSE 0
            END) AS last_month_revenue,
            COUNT(DISTINCT CASE
                WHEN b.booking_date >= date_trunc('month', CURRENT_DATE)
                 AND b.booking_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
                THEN b.user_id
            END) AS this_month_unique_customers,
            COUNT(DISTINCT CASE
                WHEN b.booking_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
                 AND b.booking_date < date_trunc('month', CURRENT_DATE)
                THEN b.user_id
            END) AS last_month_unique_customers
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
            TO_CHAR(date_trunc('month', b.booking_date), 'YYYY-MM') AS month_year,
            TO_CHAR(date_trunc('month', b.booking_date), 'Mon YYYY') AS month_name,
            COUNT(b.booking_id) AS tickets_sold,
            COALESCE(SUM(p.total_amount), 0) AS monthly_revenue
        FROM booking b
        LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.transaction_status = 'completed'
        WHERE b.booking_status = 'confirmed'
          AND b.booking_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY 1, 2
        ORDER BY 1 ASC
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
