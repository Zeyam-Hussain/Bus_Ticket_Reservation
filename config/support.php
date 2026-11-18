<?php

require_once __DIR__ . '/pricing.php';

const SUPPORT_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar'];

function support_cities(string $m): array
{
    $found = [];
    foreach (SUPPORT_CITIES as $c) {
        $p = mb_stripos($m, $c);
        if ($p !== false) $found[$p] = $c;
    }
    ksort($found);
    return array_values($found);
}

function support_intents(string $msg): array
{
    $m = mb_strtolower($msg);
    $is = fn(string $re): bool => preg_match($re, $m) === 1;
    $out = [];
    if ($is('/\b(my|mera|meri|mere)\b.*\b(booking|bookings|ticket|tickets|reservation|seat|seats|bus)\b|\bbooking (status|id)\b|#\d+/')) $out[] = 'booking';
    if ($is('/\b(my|mera|meri)\b.*\b(payment|refund|transaction)\b|\b(rejected|declined|failed|deducted|charged|successful|paid)\b/')) $out[] = 'payment';
    if ($is('/\b(bus|buses|available|schedule|depart|departure|arrive|arrival|timing|tomorrow|today|tonight|kal|aaj)\b/') || count(support_cities($m)) > 0) $out[] = 'schedule';
    if ($is('/\b(price|prices|fare|fares|expensive|costly|dynamic|demand|surge)\b/')) $out[] = 'pricing';
    return $out;
}

function support_is_escalation(string $msg): bool
{
    return preg_match('/(deducted|charged twice|double charge|duplicate payment|paisay kat|money .{0,20}(cut|gone|taken)|accident|harass|unsafe|stolen|lost my)/i', $msg) === 1;
}

function support_date_filter(string $m): ?array
{
    if (preg_match('/\b(\d{4})-(\d{2})-(\d{2})\b/', $m, $x) && checkdate((int) $x[2], (int) $x[3], (int) $x[1])) {
        return ['date' => $x[0]];
    }
    if (preg_match('/\b(tomorrow|kal)\b/', $m)) return ['offset' => 1];
    if (preg_match('/\b(today|tonight|aaj)\b/', $m)) return ['offset' => 0];
    return null;
}

function support_find_routes(PDO $db, string $msg, int $limit = 8): array
{
    $m = mb_strtolower($msg);
    $cities = support_cities($m);
    $where = ["r.status = 'active'", "r.departure_time > NOW()"];
    $p = [];
    if (count($cities) >= 2) {
        $where[] = "r.source_city = :src AND r.destination_city = :dst";
        $p[':src'] = $cities[0];
        $p[':dst'] = $cities[1];
    } elseif (count($cities) === 1) {
        $where[] = "(r.source_city = :c1 OR r.destination_city = :c2)";
        $p[':c1'] = $cities[0];
        $p[':c2'] = $cities[0];
    }
    $d = support_date_filter($m);
    if ($d && isset($d['date'])) {
        $where[] = "r.departure_time::date = CAST(:d AS DATE)";
        $p[':d'] = $d['date'];
    } elseif ($d) {
        $where[] = "r.departure_time::date = CURRENT_DATE + CAST(:off AS INTEGER)";
        $p[':off'] = $d['offset'];
    } else {
        $where[] = "r.departure_time < NOW() + INTERVAL '7 days'";
    }
    $st = $db->prepare("SELECT r.route_id, r.source_city, r.destination_city, r.departure_time, r.arrival_time,
        r.base_fare, bs.bus_type,
        bs.total_capacity - (SELECT COUNT(*) FROM booking k WHERE k.route_id = r.route_id
        AND k.booking_status IN ('pending','confirmed')) AS seats_available
        FROM route r JOIN bus bs ON bs.bus_id = r.bus_id
        WHERE " . implode(' AND ', $where) . " ORDER BY r.departure_time LIMIT " . (int) $limit);
    $st->execute($p);
    return $st->fetchAll(PDO::FETCH_ASSOC);
}

function support_facts_bookings(PDO $db, int $uid, string $msg): array
{
    $p = [':u' => $uid];
    $extra = '';
    if (preg_match('/(?:#|booking(?:\s+id)?\s*)(\d{1,9})/i', $msg, $x)) {
        $extra = ' AND b.booking_id = :bid';
        $p[':bid'] = (int) $x[1];
    }
    $st = $db->prepare("SELECT b.booking_id, b.booking_status, b.booking_date, b.cancellation_date,
        COALESCE(b.fare_charged, ROUND(r.base_fare)::int) AS fare_pkr,
        ROUND(r.base_fare)::int AS base_fare_pkr, s.seat_number,
        r.source_city, r.destination_city, r.departure_time,
        pay.transaction_status AS payment_status
        FROM booking b JOIN route r ON r.route_id = b.route_id JOIN seat s ON s.seat_id = b.seat_id
        LEFT JOIN LATERAL (
            SELECT transaction_status FROM payment WHERE booking_id = b.booking_id ORDER BY paid_at DESC LIMIT 1
        ) pay ON TRUE
        WHERE b.user_id = :u $extra ORDER BY b.booking_date DESC LIMIT 5");
    $st->execute($p);
    $out = [];
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $out[] = [
            'booking_id' => (int) $r['booking_id'], 'status' => $r['booking_status'],
            'route' => $r['source_city'] . ' to ' . $r['destination_city'],
            'departure' => $r['departure_time'], 'seat' => $r['seat_number'],
            'fare_pkr' => (int) $r['fare_pkr'], 'base_fare_pkr' => (int) $r['base_fare_pkr'],
            'payment_status' => $r['payment_status'] ?? 'no payment recorded',
            'booked_on' => $r['booking_date'], 'cancelled_on' => $r['cancellation_date'],
        ];
    }
    return $out;
}

function support_facts_payments(PDO $db, int $uid): array
{
    $st = $db->prepare("SELECT p.payment_id, p.booking_id, p.total_amount, p.payment_method,
        p.transaction_status, p.paid_at FROM payment p JOIN booking b ON b.booking_id = p.booking_id
        WHERE b.user_id = :u ORDER BY p.paid_at DESC LIMIT 5");
    $st->execute([':u' => $uid]);
    $out = [];
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $out[] = [
            'payment_id' => (int) $r['payment_id'], 'booking_id' => (int) $r['booking_id'],
            'amount_pkr' => (int) round((float) $r['total_amount']), 'method' => $r['payment_method'],
            'status' => $r['transaction_status'], 'paid_at' => $r['paid_at'],
            'note' => 'The reason for a rejected payment is not stored in the system.',
        ];
    }
    return $out;
}

function support_facts_schedule(PDO $db, int $uid, array $routes): array
{
    $buses = [];
    foreach ($routes as $r) {
        $q = pricing_active_quote($db, $uid, (int) $r['route_id']);
        $buses[] = [
            'route' => $r['source_city'] . ' to ' . $r['destination_city'],
            'departure' => $r['departure_time'], 'arrival' => $r['arrival_time'],
            'bus_type' => $r['bus_type'], 'seats_available' => max(0, (int) $r['seats_available']),
            'fare_pkr' => $q ? (int) $q['fare'] : (int) round((float) $r['base_fare']),
            'fare_type' => $q ? 'your locked fare' : 'base fare',
        ];
    }
    return [
        'buses' => $buses,
        'note' => 'Departure terminal is not stored in the system. A base fare may change to a locked dynamic fare when the customer opens the bus while logged in.',
    ];
}

function support_pricing_route_ids(PDO $db, int $uid, string $msg, array $routes): array
{
    if (count(support_cities(mb_strtolower($msg))) > 0) {
        return array_map(fn($r) => (int) $r['route_id'], array_slice($routes, 0, 2));
    }
    $st = $db->prepare("SELECT b.route_id FROM booking b JOIN route r ON r.route_id = b.route_id
        WHERE b.user_id = :u AND b.booking_status <> 'cancelled' AND r.departure_time > NOW()
        ORDER BY r.departure_time LIMIT 1");
    $st->execute([':u' => $uid]);
    $id = $st->fetchColumn();
    return $id ? [(int) $id] : [];
}

function support_facts_pricing(PDO $db, int $uid, array $route_ids): array
{
    $s = pricing_settings($db);
    $out = ['dynamic_pricing_active' => $s['mode'] === 'live', 'routes' => []];
    foreach ($route_ids as $rid) {
        $f = pricing_route_features($db, (int) $rid);
        if (!$f) continue;
        $cap = (int) $f['total_capacity'];
        $booked = (int) $f['booked'];
        $load = $cap > 0 ? $booked / $cap : 0;
        $hours = (float) $f['hours_to_departure'];
        $factors = [];
        if ($load >= 0.7) $factors[] = 'most seats on this bus are already booked (' . round($load * 100) . '% full)';
        elseif ($load <= 0.3) $factors[] = 'few seats are booked so far (' . round($load * 100) . '% full)';
        if ($hours < 24) $factors[] = 'departure is less than 24 hours away';
        elseif ($hours > 120) $factors[] = 'departure is more than 5 days away';
        if ((int) $f['departure_dow'] >= 4) $factors[] = 'departure is on a Friday, Saturday or Sunday';
        if ($cap > 0 && (int) $f['bookings_24h'] / $cap >= 0.3) $factors[] = 'many seats were booked in the last 24 hours';

        $rec = $db->prepare("SELECT predicted_demand FROM pricing_recommendations WHERE route_id = :r ORDER BY generated_at DESC LIMIT 1");
        $rec->execute([':r' => $rid]);
        $pd = $rec->fetchColumn();
        $level = $pd === false ? null : ((float) $pd < 0.35 ? 'low' : ((float) $pd < 0.65 ? 'moderate' : 'high'));
        $base = (int) round((float) $f['base_fare']);
        $q = pricing_active_quote($db, $uid, (int) $rid);
        $your = $q ? (int) $q['fare'] : $base;
        $out['routes'][] = [
            'seats_booked' => $booked, 'seats_total' => $cap, 'hours_to_departure' => round($hours),
            'predicted_demand_level' => $level, 'factors_in_play' => $factors,
            'base_fare_pkr' => $base, 'your_fare_pkr' => $your,
            'fare_type' => $q ? 'your locked fare' : 'base fare',
            'fare_compared_to_base' => $your > $base ? 'higher' : ($your < $base ? 'lower' : 'same'),
        ];
    }
    return $out;
}

function support_build_facts(PDO $db, int $uid, string $msg, array $intents): array
{
    $has = fn(string $i): bool => in_array($i, $intents, true);
    $facts = [];
    $routes = ($has('schedule') || $has('pricing')) ? support_find_routes($db, $msg) : [];
    if ($has('booking') || $has('payment')) $facts['your_bookings'] = support_facts_bookings($db, $uid, $msg);
    if ($has('payment')) $facts['your_payments'] = support_facts_payments($db, $uid);
    if ($has('schedule')) $facts['upcoming_buses'] = support_facts_schedule($db, $uid, $routes);
    if ($has('pricing')) $facts['pricing'] = support_facts_pricing($db, $uid, support_pricing_route_ids($db, $uid, $msg, $routes));
    return $facts;
}

function support_call_ai(array $payload): ?array
{
    $url = rtrim(pricing_env('AI_SERVICE_URL', 'http://ai_service:8000'), '/') . '/rag/chat';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 100,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-Internal-Secret: ' . pricing_env('AI_SERVICE_SECRET', ''),
        ],
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false || $code !== 200) {
        error_log("Support AI call failed (HTTP $code)");
        return null;
    }
    $j = json_decode($body, true);
    if (!is_array($j) || !isset($j['answer']) || !is_string($j['answer']) || trim($j['answer']) === '') return null;
    return [
        'answer' => mb_substr(trim($j['answer']), 0, 1500),
        'sources' => array_values(array_filter((array) ($j['sources'] ?? []), 'is_string')),
    ];
}
