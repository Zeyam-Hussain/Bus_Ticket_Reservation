<?php

function pricing_env(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? getenv($key);
    return ($value === false || $value === '') ? $default : $value;
}

function pricing_settings(PDO $db): array
{
    $row = $db->query(
        "SELECT mode, quote_ttl_minutes FROM pricing_settings WHERE id = 1"
    )->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new RuntimeException("Dynamic pricing settings are missing.");
    }

    return $row;
}

function pricing_route_features(PDO $db, int $route_id): ?array
{
    $statement = $db->prepare("
        SELECT
            r.route_id,
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
            GREATEST(
                EXTRACT(EPOCH FROM (r.departure_time - NOW())) / 3600,
                0
            ) AS hours_to_departure,
            (EXTRACT(ISODOW FROM r.departure_time)::INTEGER - 1) AS departure_dow,
            r.departure_time
        FROM route r
        JOIN bus b ON b.bus_id = r.bus_id
        WHERE r.route_id = :route_id
          AND r.status = 'active'
          AND r.departure_time > NOW()
    ");
    $statement->execute([':route_id' => $route_id]);
    $route = $statement->fetch(PDO::FETCH_ASSOC);

    return $route ?: null;
}

function pricing_call_ai(array $features, float $base, float $minimum, float $maximum): ?array
{
    $secret = pricing_env('AI_SERVICE_SECRET', '');
    if ($secret === '') {
        error_log("AI pricing request skipped: internal service secret is not configured.");
        return null;
    }

    $payload = json_encode([
        'route_id' => (int) $features['route_id'],
        'base_fare' => max(1, (int) round($base)),
        'min_fare' => max(1, (int) ceil($minimum)),
        'max_fare' => max(1, (int) floor($maximum)),
        'capacity' => (int) $features['total_capacity'],
        'booked' => (int) $features['booked'],
        'hours_to_departure' => max(0.0, (float) $features['hours_to_departure']),
        'departure_dow' => (int) $features['departure_dow'],
        'bookings_24h' => (int) $features['bookings_24h'],
    ], JSON_THROW_ON_ERROR);

    $url = rtrim(
        pricing_env('AI_SERVICE_URL', 'http://ai_service:8000'),
        '/'
    ) . '/pricing/recommend';
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", [
                'Content-Type: application/json',
                'X-Internal-Secret: ' . $secret,
                'Content-Length: ' . strlen($payload),
            ]),
            'content' => $payload,
            'timeout' => 3,
            'ignore_errors' => true,
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    $status = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches)) {
            $status = (int) $matches[1];
        }
    }

    if ($body === false || $status !== 200) {
        error_log("AI pricing request failed for route {$features['route_id']} (HTTP $status).");
        return null;
    }

    try {
        $result = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        error_log("AI pricing response was invalid for route {$features['route_id']}.");
        return null;
    }

    if (
        !is_array($result)
        || !isset($result['recommended_fare'], $result['predicted_demand'], $result['model_version'])
        || !is_numeric($result['recommended_fare'])
        || !is_numeric($result['predicted_demand'])
        || !is_string($result['model_version'])
        || !is_finite((float) $result['recommended_fare'])
        || !is_finite((float) $result['predicted_demand'])
    ) {
        error_log("AI pricing response did not match the expected contract for route {$features['route_id']}.");
        return null;
    }

    return $result;
}

function pricing_recommend(PDO $db, array $features, bool $force = false): ?array
{
    $base = (float) $features['base_fare'];
    $minimum = (float) $features['min_fare'];
    $maximum = (float) $features['max_fare'];

    if (!$force) {
        $cached = $db->prepare("
            SELECT recommendation_id, recommended_fare, predicted_demand, model_version
            FROM pricing_recommendations
            WHERE route_id = :route_id
              AND base_fare = :base_fare
              AND min_fare = :min_fare
              AND max_fare = :max_fare
              AND generated_at > NOW() - INTERVAL '5 minutes'
            ORDER BY generated_at DESC
            LIMIT 1
        ");
        $cached->execute([
            ':route_id' => $features['route_id'],
            ':base_fare' => $features['base_fare'],
            ':min_fare' => $features['min_fare'],
            ':max_fare' => $features['max_fare'],
        ]);
        $row = $cached->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return [
                'recommendation_id' => (int) $row['recommendation_id'],
                'fare' => max($minimum, min($maximum, (float) $row['recommended_fare'])),
                'demand' => (float) $row['predicted_demand'],
                'model_version' => $row['model_version'],
            ];
        }
    }

    $result = pricing_call_ai($features, $base, $minimum, $maximum);
    if ($result === null) {
        return null;
    }

    $fare = max($minimum, min($maximum, (float) $result['recommended_fare']));
    $demand = min(1.0, max(0.0, (float) $result['predicted_demand']));
    $snapshot = json_encode([
        'capacity' => (int) $features['total_capacity'],
        'booked' => (int) $features['booked'],
        'bookings_24h' => (int) $features['bookings_24h'],
        'hours_to_departure' => round((float) $features['hours_to_departure'], 2),
        'departure_dow' => (int) $features['departure_dow'],
    ], JSON_THROW_ON_ERROR);

    $insert = $db->prepare("
        INSERT INTO pricing_recommendations
            (route_id, model_version, feature_snapshot, predicted_demand,
             base_fare, recommended_fare, min_fare, max_fare)
        VALUES (:route_id, :model_version, CAST(:snapshot AS JSONB), :demand,
                :base_fare, :fare, :min_fare, :max_fare)
        RETURNING recommendation_id
    ");
    $insert->execute([
        ':route_id' => $features['route_id'],
        ':model_version' => substr($result['model_version'], 0, 50),
        ':snapshot' => $snapshot,
        ':demand' => $demand,
        ':base_fare' => $base,
        ':fare' => $fare,
        ':min_fare' => $minimum,
        ':max_fare' => $maximum,
    ]);

    return [
        'recommendation_id' => (int) $insert->fetchColumn(),
        'fare' => $fare,
        'demand' => $demand,
        'model_version' => $result['model_version'],
    ];
}

function pricing_active_quote(PDO $db, int $user_id, int $route_id): ?array
{
    $statement = $db->prepare("
        SELECT quote_id, fare, expires_at
        FROM fare_quotes
        WHERE user_id = :user_id
          AND route_id = :route_id
          AND used_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $statement->execute([':user_id' => $user_id, ':route_id' => $route_id]);
    $quote = $statement->fetch(PDO::FETCH_ASSOC);

    return $quote ?: null;
}

function pricing_ensure_quote(PDO $db, int $user_id, int $route_id): ?array
{
    if (!$db->inTransaction()) {
        throw new LogicException("Fare quotes must be created inside a transaction.");
    }

    $lock = $db->prepare("SELECT pg_advisory_xact_lock(hashtextextended(:lock_key, 0))");
    $lock->execute([':lock_key' => "$user_id:$route_id"]);

    $features = pricing_route_features($db, $route_id);
    if ($features === null) {
        return null;
    }

    $base = (float) $features['base_fare'];
    $settings = pricing_settings($db);
    $activeQuote = pricing_active_quote($db, $user_id, $route_id);
    if ($activeQuote !== null) {
        return [
            'route_id' => $route_id,
            'fare' => (float) $activeQuote['fare'],
            'quote_id' => $activeQuote['quote_id'],
            'expires_at' => $activeQuote['expires_at'],
            'source' => 'ai',
        ];
    }

    if ($settings['mode'] === 'off') {
        return [
            'route_id' => $route_id,
            'fare' => $base,
            'quote_id' => null,
            'expires_at' => null,
            'source' => 'base',
        ];
    }

    if ($settings['mode'] === 'shadow') {
        pricing_recommend($db, $features);
        return [
            'route_id' => $route_id,
            'fare' => $base,
            'quote_id' => null,
            'expires_at' => null,
            'source' => 'base',
        ];
    }

    $deleteExpired = $db->prepare("
        DELETE FROM fare_quotes
        WHERE user_id = :user_id AND route_id = :route_id
          AND used_at IS NULL AND expires_at <= NOW()
    ");
    $deleteExpired->execute([':user_id' => $user_id, ':route_id' => $route_id]);

    $recommendation = pricing_recommend($db, $features);
    if ($recommendation === null) {
        return [
            'route_id' => $route_id,
            'fare' => $base,
            'quote_id' => null,
            'expires_at' => null,
            'source' => 'base_fallback',
        ];
    }

    $quoteId = bin2hex(random_bytes(16));
    $insert = $db->prepare("
        INSERT INTO fare_quotes
            (quote_id, user_id, route_id, recommendation_id, fare, expires_at)
        VALUES (
            :quote_id, :user_id, :route_id, :recommendation_id, :fare,
            NOW() + (CAST(:ttl AS INTEGER) * INTERVAL '1 minute')
        )
    ");
    $insert->execute([
        ':quote_id' => $quoteId,
        ':user_id' => $user_id,
        ':route_id' => $route_id,
        ':recommendation_id' => $recommendation['recommendation_id'],
        ':fare' => $recommendation['fare'],
        ':ttl' => (int) $settings['quote_ttl_minutes'],
    ]);

    $quote = pricing_active_quote($db, $user_id, $route_id);
    if ($quote === null) {
        throw new RuntimeException("Created fare quote could not be retrieved.");
    }

    return [
        'route_id' => $route_id,
        'fare' => (float) $quote['fare'],
        'quote_id' => $quote['quote_id'],
        'expires_at' => $quote['expires_at'],
        'source' => 'ai',
    ];
}

function pricing_fare_for_booking(
    PDO $db,
    int $user_id,
    int $route_id,
    ?string $quote_id
): array {
    $features = pricing_route_features($db, $route_id);
    if ($features === null) {
        throw new Exception("Route is not available for booking.", 409);
    }

    $base = (float) $features['base_fare'];
    if ($quote_id !== null && $quote_id !== '') {
        $statement = $db->prepare("
            SELECT quote_id, fare
            FROM fare_quotes
            WHERE quote_id = :quote_id
              AND user_id = :user_id
              AND route_id = :route_id
              AND used_at IS NULL
              AND expires_at > NOW()
            FOR UPDATE
        ");
        $statement->execute([
            ':quote_id' => $quote_id,
            ':user_id' => $user_id,
            ':route_id' => $route_id,
        ]);
        $quote = $statement->fetch(PDO::FETCH_ASSOC);
        if (!$quote) {
            throw new Exception("Your fare quote expired or is invalid. Refresh the fare and try again.", 409);
        }

        return ['fare' => (float) $quote['fare'], 'quote_id' => $quote['quote_id']];
    }

    $settings = pricing_settings($db);
    if ($settings['mode'] !== 'live') {
        return ['fare' => $base, 'quote_id' => null];
    }

    $quote = pricing_ensure_quote($db, $user_id, $route_id);
    if ($quote !== null && $quote['quote_id'] !== null) {
        throw new Exception("Your fare was updated. Refresh the fare before booking.", 409);
    }

    return ['fare' => $base, 'quote_id' => null];
}
