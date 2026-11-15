<?php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';
include_once '../../config/pricing.php';

if (($decoded_user['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Admin access required."]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $settings = pricing_settings($db);
        $rows = $db->query("
            SELECT
                r.route_id,
                r.source_city,
                r.destination_city,
                r.departure_time,
                r.base_fare,
                r.min_fare,
                r.max_fare,
                b.total_capacity,
                (
                    SELECT COUNT(*)
                    FROM booking active_booking
                    WHERE active_booking.route_id = r.route_id
                      AND active_booking.booking_status IN ('pending', 'confirmed')
                ) AS booked,
                (
                    SELECT COUNT(*)
                    FROM booking recent_booking
                    WHERE recent_booking.route_id = r.route_id
                      AND recent_booking.booking_status IN ('pending', 'confirmed')
                      AND recent_booking.booking_date > NOW() - INTERVAL '24 hours'
                ) AS bookings_24h,
                recommendation.recommended_fare,
                recommendation.predicted_demand,
                recommendation.model_version,
                recommendation.generated_at
            FROM route r
            JOIN bus b ON b.bus_id = r.bus_id
            LEFT JOIN LATERAL (
                SELECT p.recommended_fare, p.predicted_demand, p.model_version, p.generated_at
                FROM pricing_recommendations p
                WHERE p.route_id = r.route_id
                ORDER BY p.generated_at DESC, p.recommendation_id DESC
                LIMIT 1
            ) recommendation ON TRUE
            WHERE r.status = 'active' AND r.departure_time > NOW()
            ORDER BY r.departure_time
            LIMIT 200
        ")->fetchAll(PDO::FETCH_ASSOC);

        $routes = array_map(static function (array $row): array {
            return [
                'route_id' => (int) $row['route_id'],
                'source_city' => $row['source_city'],
                'destination_city' => $row['destination_city'],
                'departure_time' => $row['departure_time'],
                'capacity' => (int) $row['total_capacity'],
                'booked' => (int) $row['booked'],
                'bookings_24h' => (int) $row['bookings_24h'],
                'base_fare' => (float) $row['base_fare'],
                'min_fare' => (float) $row['min_fare'],
                'max_fare' => (float) $row['max_fare'],
                'rec_fare' => $row['recommended_fare'] === null
                    ? null
                    : (float) $row['recommended_fare'],
                'rec_demand' => $row['predicted_demand'] === null
                    ? null
                    : (float) $row['predicted_demand'],
                'rec_model' => $row['model_version'],
                'rec_at' => $row['generated_at'],
            ];
        }, $rows);

        echo json_encode([
            "status" => "success",
            "data" => [
                "mode" => $settings['mode'],
                "quote_ttl_minutes" => (int) $settings['quote_ttl_minutes'],
                "routes" => $routes,
            ],
        ]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Use GET or POST method."]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) {
        throw new Exception("Invalid JSON request.", 400);
    }
    $adminId = (int) $decoded_user['user_id'];
    $action = $data['action'] ?? '';

    if ($action === 'set_mode') {
        $mode = $data['mode'] ?? '';
        if (!in_array($mode, ['off', 'shadow', 'live'], true)) {
            throw new Exception("Mode must be off, shadow, or live.", 400);
        }
        $statement = $db->prepare("
            UPDATE pricing_settings
            SET mode = :mode, updated_by = :admin_id, updated_at = NOW()
            WHERE id = 1
        ");
        $statement->execute([':mode' => $mode, ':admin_id' => $adminId]);
        echo json_encode(["status" => "success", "message" => "Pricing mode updated to $mode."]);
        exit();
    }

    if ($action === 'set_fares') {
        $values = [];
        foreach (['route_id', 'base_fare', 'min_fare', 'max_fare'] as $key) {
            $value = filter_var($data[$key] ?? null, FILTER_VALIDATE_INT);
            if ($value === false || $value < 1) {
                throw new Exception("$key must be a positive whole number.", 400);
            }
            $values[$key] = $value;
        }
        if (
            $values['min_fare'] > $values['base_fare']
            || $values['base_fare'] > $values['max_fare']
        ) {
            throw new Exception("Fares must satisfy minimum <= base <= maximum.", 400);
        }

        $statement = $db->prepare("
            UPDATE route
            SET base_fare = :base_fare, min_fare = :min_fare, max_fare = :max_fare
            WHERE route_id = :route_id
            RETURNING route_id
        ");
        $statement->execute([
            ':base_fare' => $values['base_fare'],
            ':min_fare' => $values['min_fare'],
            ':max_fare' => $values['max_fare'],
            ':route_id' => $values['route_id'],
        ]);
        if ($statement->fetchColumn() === false) {
            throw new Exception("Route not found.", 404);
        }

        echo json_encode(["status" => "success", "message" => "Route fare bounds saved."]);
        exit();
    }

    if ($action === 'refresh') {
        $routeIds = $db->query("
            SELECT route_id FROM route
            WHERE status = 'active' AND departure_time > NOW()
            ORDER BY departure_time LIMIT 200
        ")->fetchAll(PDO::FETCH_COLUMN);
        $refreshed = 0;
        foreach ($routeIds as $routeId) {
            $features = pricing_route_features($db, (int) $routeId);
            if ($features !== null && pricing_recommend($db, $features, true) !== null) {
                $refreshed++;
            }
        }

        if ($refreshed !== count($routeIds)) {
            http_response_code(502);
            echo json_encode([
                "status" => "error",
                "message" => "AI recommendations refreshed for $refreshed of " . count($routeIds) . " routes. Check AI service health.",
                "data" => ["refreshed" => $refreshed, "total" => count($routeIds)],
            ]);
            exit();
        }

        echo json_encode([
            "status" => "success",
            "message" => "AI recommendations refreshed for $refreshed routes.",
        ]);
        exit();
    }

    throw new Exception("Unknown pricing action.", 400);
} catch (Throwable $error) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    $errorCode = (int) $error->getCode();
    $status = $errorCode >= 400 && $errorCode < 600 ? $errorCode : 500;
    if ($status === 500) {
        error_log("Pricing admin error: " . $error->getMessage());
    }
    http_response_code($status);
    echo json_encode([
        "status" => "error",
        "message" => $status === 500 ? "Pricing administration failed." : $error->getMessage(),
    ]);
}
