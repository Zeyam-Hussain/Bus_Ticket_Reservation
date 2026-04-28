<?php
// api/booking/book.php
// FIX: Correct include order — core.php must be first.
// FIX: user_id is now taken from the verified JWT token, not from POST body.
//      A passenger can no longer book on behalf of another user.

include_once '../../config/core.php';        // 1st: sets headers + loads env
include_once '../../config/database.php';    // 2nd: Database class
include_once '../../config/validate_token.php'; // 3rd: validates JWT, gives $decoded_user

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$database = new Database();
$db       = $database->getConnection();
$data     = json_decode(file_get_contents("php://input"), true);

// FIX: user_id comes from the token — remove it from required input check
if (empty($data['route_id']) || empty($data['seats'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "route_id and seats are required."]);
    exit();
}

// FIX: Always use the authenticated user's ID
$user_id = $decoded_user['user_id'];

try {
    $db->beginTransaction();

    // 1. Check bus capacity
    $cap_stmt = $db->prepare("
        SELECT b.total_capacity,
            (SELECT COUNT(*) FROM booking
             WHERE route_id = :rid1 AND booking_status IN ('confirmed', 'pending')) AS current_bookings
        FROM bus b
        JOIN route r ON b.bus_id = r.bus_id
        WHERE r.route_id = :rid2
        LIMIT 1
    ");
    $cap_stmt->bindParam(':rid1', $data['route_id']);
    $cap_stmt->bindParam(':rid2', $data['route_id']);
    $cap_stmt->execute();
    $capacity = $cap_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$capacity) {
        throw new Exception("Invalid route.", 404);
    }

    $total_requested = count($data['seats']);

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

        // 2. Check seat exists
        $seat_exist = $db->prepare("SELECT seat_id FROM seat WHERE seat_id = :seat_id");
        $seat_exist->bindParam(':seat_id', $seat_id);
        $seat_exist->execute();

        if ($seat_exist->rowCount() === 0) {
            throw new Exception("Seat ID $seat_id does not exist.", 400);
        }

        // 3. Check seat not already booked on this route
        $seat_check = $db->prepare("
            SELECT booking_id FROM booking
            WHERE route_id = :route_id AND seat_id = :seat_id AND booking_status IN ('confirmed', 'pending')
        ");
        $seat_check->bindParam(':route_id', $data['route_id']);
        $seat_check->bindParam(':seat_id',  $seat_id);
        $seat_check->execute();

        if ($seat_check->rowCount() > 0) {
            throw new Exception("Seat $seat_id is already booked.", 409);
        }

        // 3.5 Check if locked temporarily by ANOTHER user
        $lock_check = $db->prepare("
            SELECT user_id FROM seat_locks
            WHERE route_id = :route_id AND seat_id = :seat_id AND locked_until > NOW()
        ");
        $lock_check->bindParam(':route_id', $data['route_id']);
        $lock_check->bindParam(':seat_id',  $seat_id);
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
        $neighbor->bindParam(':route_id', $data['route_id']);
        $neighbor->bindParam(':adjacent', $adjacent_seat_id);
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
            INSERT INTO booking (user_id, route_id, seat_id, passenger_gender, booking_date, booking_status)
            VALUES (:user_id, :route_id, :seat_id, :gender, NOW(), 'pending')
        ");
        $insert->bindParam(':user_id',  $user_id);
        $insert->bindParam(':route_id', $data['route_id']);
        $insert->bindParam(':seat_id',  $seat_id);
        $insert->bindParam(':gender',   $gender);
        $insert->execute();

        $booking_ids[] = (int)$db->lastInsertId();

        // 6. Clear lock
        $clear_lock = $db->prepare("DELETE FROM seat_locks WHERE route_id = :route_id AND seat_id = :seat_id");
        $clear_lock->bindParam(':route_id', $data['route_id']);
        $clear_lock->bindParam(':seat_id',  $seat_id);
        $clear_lock->execute();
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        "status"  => "success",
        "message" => "All seats booked successfully!",
        "booking_ids" => $booking_ids
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) $db->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
