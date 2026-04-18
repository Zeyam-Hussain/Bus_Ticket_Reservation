<?php
// acceptance_test.php
// This script assumes XAMPP is running and reachable at http://localhost/bus_backend

$base_url = "http://localhost/bus_backend/api";

function send_request($method, $url, $data = [], $token = null) {
    $ch = curl_init();
    
    // Setup URL and Method
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Setup Headers
    $headers = ['Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    // Setup Body
    if (!empty($data)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);
    
    if ($response === false) {
        return [
            'code' => 0,
            'body' => $curl_error
        ];
    }
    
    return [
        'code' => $http_code,
        'body' => json_decode($response, true) ?? $response
    ];
}

function print_result($test_name, $res, $expected_codes) {
    if (in_array($res['code'], $expected_codes)) {
        echo "\033[32m[PASS]\033[0m " . $test_name . " (Code: " . $res['code'] . ")\n";
        return true;
    } else {
        echo "\033[31m[FAIL]\033[0m " . $test_name . " (Code: " . $res['code'] . ")\n";
        echo "       Response: " . json_encode($res['body']) . "\n";
        return false;
    }
}

if (php_sapi_name() !== 'cli') {
    echo "<pre style='background: #1e1e1e; color: #fff; padding: 20px; border-radius: 8px; font-family: monospace;'>";
}

echo "=====================================\n";
echo "  BUS RESERVATION ACCEPTANCE TESTS   \n";
echo "=====================================\n\n";

// 1. Create a mock admin token or register an admin to get a valid token.
// Assuming we don't have a valid active user, let's just attempt to register & login an admin.
$admin_email = "testadmin_" . time() . "@example.com";
$user_email = "testuser_" . time() . "@example.com";
$password = "Secret123!";

echo "--> Setting up Admin Account\n";
$reg_admin = send_request('POST', "$base_url/user/register_admin.php", [
    "full_name" => "Admin Test",
    "email" => $admin_email,
    "password" => $password,
    "admin_secret" => "Fast123@"
]);
print_result("Register Admin", $reg_admin, [201, 400]); // 400 or 409 if already exists

$login_admin = send_request('POST', "$base_url/user/login.php", [
    "email" => $admin_email,
    "password" => $password
]);
$admin_token = $login_admin['body']['access_token'] ?? null;
if (!$admin_token) {
    echo "\033[31m[FATAL]\033[0m Could not obtain Admin token. Are DB and server running?\n";
    echo "Response: " . json_encode($login_admin['body']) . "\n";
    exit(1);
}
echo "--> Admin token retrieved.\n\n";

echo "--> Setting up User Account\n";
$reg_user = send_request('POST', "$base_url/user/register.php", [
    "full_name" => "User Test",
    "email" => $user_email,
    "phone" => "0987654321",
    "password" => $password
]);
print_result("Register User", $reg_user, [201, 400]);

$login_user = send_request('POST', "$base_url/user/login.php", [
    "email" => $user_email,
    "password" => $password
]);
$user_token = $login_user['body']['access_token'] ?? null;
if (!$user_token) {
    echo "\033[31m[FATAL]\033[0m Could not obtain User token.\n";
    exit(1);
}
echo "--> User token retrieved.\n\n";


// --- Test Bus Management ---
echo "--- Testing Admin Bus CRUD ---\n";
$bus_reg = "TEST-" . rand(1000, 9999);

$create_bus = send_request('POST', "$base_url/buses/create_bus.php", [
    "bus_type" => "AC",
    "registration_number" => $bus_reg,
    "total_capacity" => 40
], $admin_token);
print_result("Create Bus", $create_bus, [201]);
$bus_id = $create_bus['body']['bus_id'] ?? null;

if ($bus_id) {
    $update_bus = send_request('PUT', "$base_url/buses/update_bus.php", [
        "bus_id" => $bus_id,
        "total_capacity" => 50
    ], $admin_token);
    print_result("Update Bus", $update_bus, [200]);
} else {
     echo "\033[33m[SKIP]\033[0m Update Bus (No bus ID)\n";
}

// --- Test Route Management ---
echo "\n--- Testing Admin Route CRUD ---\n";

$route_id = null;
if ($bus_id) {
    $create_route = send_request('POST', "$base_url/admin/create_route.php", [
        "bus_id" => $bus_id,
        "source_city" => "Test City A",
        "destination_city" => "Test City B",
        "departure_time" => "2029-12-01 10:00:00",
        "arrival_time" => "2029-12-01 15:00:00",
        "base_fare" => 100
    ], $admin_token);
    print_result("Create Route", $create_route, [201]);
    $route_id = $create_route['body']['route_id'] ?? null;
    
    if ($route_id) {
        $update_route = send_request('PUT', "$base_url/admin/update_route.php", [
            "route_id" => $route_id,
            "base_fare" => 150
        ], $admin_token);
        print_result("Update Route", $update_route, [200]);
    } else {
        echo "\033[33m[SKIP]\033[0m Update Route (No route ID)\n";
    }
} else {
    echo "\033[33m[SKIP]\033[0m Create Route/Update Route (No bus ID)\n";
}

$get_routes = send_request('GET', "$base_url/admin/get_all_routes.php", [], $admin_token);
print_result("Get All Routes", $get_routes, [200]);

// --- Test Booking Cancellation ---
// This is typically hard to mock precisely without doing a full booking lifecycle including passing seats 
// but we verify the endpoint is available and rejects gracefully
echo "\n--- Testing User Cancel Booking ---\n";
$user_cancel = send_request('POST', "$base_url/user/cancel_booking.php", [
    "booking_id" => 9999999 // Fictional ID
], $user_token);
// We expect a 404 because the booking 9999999 shouldn't exist, which proves the endpoint works and correctly applies rules!
print_result("User Cancel Booking (Not Found Check)", $user_cancel, [404]);

// --- Cleanup (Deletes) ---
echo "\n--- Cleanup Tests ---\n";
if ($route_id) {
    $del_route = send_request('DELETE', "$base_url/admin/delete_route.php", [
        "route_id" => $route_id
    ], $admin_token);
    print_result("Delete Route", $del_route, [200]);
}

if ($bus_id) {
    $del_bus = send_request('DELETE', "$base_url/buses/delete_bus.php", [
        "bus_id" => $bus_id
    ], $admin_token);
    print_result("Delete Bus", $del_bus, [200]);
}

echo "\n=====================================\n";
echo "        TEST SUITE COMPLETED         \n";
echo "=====================================\n";

if (php_sapi_name() !== 'cli') {
    echo "</pre>";
}
?>
