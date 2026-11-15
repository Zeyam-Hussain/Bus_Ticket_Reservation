<?php
// api/booking/book.php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';
include_once '../../config/pricing.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"), true);


if (
    !is_array($data)
    || !isset($data['route_id'])
    || filter_var($data['route_id'], FILTER_VALIDATE_INT) === false
    || (int) $data['route_id'] < 1
    || !isset($data['seats'])
    || !is_array($data['seats'])
    || count($data['seats']) < 1
    || count($data['seats']) > 10
) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "A valid route_id and between 1 and 10 seats are required."]);
    exit();
}

$user_id = (int) $decoded_user['user_id'];
$route_id = (int) $data['route_id'];
$quoteId = $data['quote_id'] ?? null;
if ($quoteId !== null && (!is_string($quoteId) || !preg_match('/^[a-f0-9]{32}$/', $quoteId))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid fare quote. Refresh the fare and try again."]);
    exit();
}

try {
    $db->beginTransaction();

    // Serialize bookings for this route while checking availability.
    $cap_stmt = $db->prepare("
        SELECT b.total_capacity,
            (SELECT COUNT(*) FROM booking
             WHERE route_id = r.route_id AND booking_status IN ('confirmed', 'pending')) AS current_bookings
        FROM bus b
        JOIN route r ON b.bus_id = r.bus_id
        WHERE r.route_id = :route_id
          AND r.status = 'active'
          AND r.departure_time > NOW()
        LIMIT 1
        FOR UPDATE OF r
    ");
    $cap_stmt->bindValue(':route_id', $route_id, PDO::PARAM_INT);
    $cap_stmt->execute();
    $capacity = $cap_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$capacity) {
        throw new Exception("Invalid route.", 404);
    }

    $fare_info = pricing_fare_for_booking($db, $user_id, $route_id, $quoteId);
    $total_requested = count($data['seats']);
    $requestedSeatIds = [];
    foreach ($data['seats'] as $seat) {
        if (!isset($seat['seat_id']) || filter_var($seat['seat_id'], FILTER_VALIDATE_INT) === false) {
            throw new Exception("Each seat must have a valid seat_id and gender.", 400);
        }
        $requestedSeatIds[] = (int) $seat['seat_id'];
    }
    if (count(array_unique($requestedSeatIds)) !== $total_requested) {
        throw new Exception("A seat cannot be selected more than once.", 400);
    }

    if (($capacity['current_bookings'] + $total_requested) > $capacity['total_capacity']) {
        throw new Exception("Not enough seats available.", 409);
    }

    $booking_ids = [];

    foreach ($data['seats'] as $seat) {

        if (empty($seat['seat_id']) || empty($seat['gender'])) {
            throw new Exception("Each seat must have seat_id and gender.", 400);
        }

        if (!in_array($seat['gender'], ['Male', 'Female'])) {
            throw new Exception("Gender must be Male or Female.", 400);
        }

        $seat_id = (int) $seat['seat_id'];
        $gender  = $seat['gender'];

        // A seat must belong to the bus assigned to this route.
        $seat_exist = $db->prepare("
            SELECT s.seat_id
            FROM seat s
            JOIN route r ON r.bus_id = s.bus_id
            WHERE s.seat_id = :seat_id AND r.route_id = :route_id
        ");
        $seat_exist->bindValue(':seat_id', $seat_id, PDO::PARAM_INT);
        $seat_exist->bindValue(':route_id', $route_id, PDO::PARAM_INT);
        $seat_exist->execute();

        if ($seat_exist->fetchColumn() === false) {
            throw new Exception("Seat ID $seat_id does not exist.", 400);
        }

        // 3. Check seat not already booked on this route
        $seat_check = $db->prepare("
            SELECT booking_id FROM booking
            WHERE route_id = :route_id AND seat_id = :seat_id AND booking_status IN ('confirmed', 'pending')
        ");
        $seat_check->bindValue(':route_id', $route_id, PDO::PARAM_INT);
        $seat_check->bindValue(':seat_id', $seat_id, PDO::PARAM_INT);
        $seat_check->execute();

        if ($seat_check->rowCount() > 0) {
            throw new Exception("Seat $seat_id is already booked.", 409);
        }

        // Check if locked temporarily by another user
        $lock_check = $db->prepare("
            SELECT user_id FROM seat_locks
            WHERE route_id = :route_id AND seat_id = :seat_id AND locked_until > NOW()
        ");
        $lock_check->bindValue(':route_id', $route_id, PDO::PARAM_INT);
        $lock_check->bindValue(':seat_id', $seat_id, PDO::PARAM_INT);
        $lock_check->execute();

        if ($lock_check->rowCount() > 0) {
            $lock = $lock_check->fetch(PDO::FETCH_ASSOC);
            if ($lock['user_id'] != $user_id) {
                throw new Exception("Seat $seat_id is currently locked by another user completing their payment.", 409);
            }
        }

        // 4. Gender rule: adjacent seats must be same gender (unless same user / family)
        $adjacent_seat_id = ($seat_id % 2 !== 0) ? ($seat_id + 1) : ($seat_id - 1);

        $neighbor = $db->prepare("
            SELECT passenger_gender, user_id FROM booking
            WHERE route_id = :route_id
              AND seat_id  = :adjacent
              AND booking_status IN ('confirmed', 'pending')
            LIMIT 1
        ");
        $neighbor->bindValue(':route_id', $route_id, PDO::PARAM_INT);
        $neighbor->bindValue(':adjacent', $adjacent_seat_id, PDO::PARAM_INT);
        $neighbor->execute();

        if ($neighbor->rowCount() > 0) {
            $nbr = $neighbor->fetch(PDO::FETCH_ASSOC);
            // Different user → enforce gender rule
            if ($nbr['user_id'] != $user_id && $nbr['passenger_gender'] !== $gender) {
                throw new Exception("Seat $seat_id denied: cannot sit next to opposite gender.", 403);
            }
        }

        // 5. Insert booking
        $insert = $db->prepare("
            INSERT INTO booking (
                user_id, route_id, seat_id, passenger_gender, booking_date,
                booking_status, fare_charged, quote_id
            )
            VALUES (
                :user_id, :route_id, :seat_id, :gender, NOW(),
                'pending', :fare_charged, :quote_id
            )
            RETURNING booking_id
        ");
        $insert->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $insert->bindValue(':route_id', $route_id, PDO::PARAM_INT);
        $insert->bindValue(':seat_id', $seat_id, PDO::PARAM_INT);
        $insert->bindValue(':gender', $gender);
        $insert->bindValue(':fare_charged', $fare_info['fare']);
        $insert->bindValue(':quote_id', $fare_info['quote_id']);
        $insert->execute();

        $booking_ids[] = (int)$insert->fetchColumn();

        // 6. Clear lock
        $clear_lock = $db->prepare("DELETE FROM seat_locks WHERE route_id = :route_id AND seat_id = :seat_id");
        $clear_lock->bindValue(':route_id', $route_id, PDO::PARAM_INT);
        $clear_lock->bindValue(':seat_id', $seat_id, PDO::PARAM_INT);
        $clear_lock->execute();
    }

    if ($fare_info['quote_id'] !== null) {
        $use_quote = $db->prepare("
            UPDATE fare_quotes SET used_at = NOW()
            WHERE quote_id = :quote_id AND used_at IS NULL
        ");
        $use_quote->execute([':quote_id' => $fare_info['quote_id']]);
        if ($use_quote->rowCount() !== 1) {
            throw new Exception("Fare quote is no longer available. Refresh the fare and try again.", 409);
        }
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        "status"  => "success",
        "message" => "All seats booked successfully!",
        "booking_ids" => $booking_ids,
        "fare_per_seat" => $fare_info['fare'],
        "total_fare" => $fare_info['fare'] * count($booking_ids),
    ]);

} catch (Throwable $error) {
    if ($db->inTransaction()) $db->rollBack();
    $errorCode = (int) $error->getCode();
    $code = ($errorCode >= 400 && $errorCode < 600) ? $errorCode : 500;
    if ($code === 500) {
        error_log("Booking error: " . $error->getMessage());
    }
    http_response_code($code);
    $safeMessage = $code === 500 ? "Booking failed. Please try again." : $error->getMessage();
    echo json_encode(["status" => "error", "message" => $safeMessage]);
}
?>
