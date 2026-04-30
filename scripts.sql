-- Bus Ticket Reservation System - Database Schema & Scripts

-- 1. Users Table (Core Schema)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'passenger') DEFAULT 'passenger',
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expiry DATETIME DEFAULT NULL,
    otp_requests INT DEFAULT 0,
    otp_last_request DATE DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Buses Table
CREATE TABLE IF NOT EXISTS bus (
    bus_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    bus_type ENUM('standard', 'luxury', 'sleeper') NOT NULL,
    total_capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Routes Table
CREATE TABLE IF NOT EXISTS route (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    source_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (bus_id) REFERENCES bus(bus_id) ON DELETE CASCADE
);

-- 4. Seats Table
CREATE TABLE IF NOT EXISTS seat (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_type ENUM('male', 'female', 'unassigned') DEFAULT 'unassigned',
    UNIQUE(bus_id, seat_number),
    FOREIGN KEY (bus_id) REFERENCES bus(bus_id) ON DELETE CASCADE
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    route_id INT NOT NULL,
    seat_id INT NOT NULL,
    passenger_gender ENUM('Male', 'Female') NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancellation_date DATETIME DEFAULT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (route_id) REFERENCES route(route_id),
    FOREIGN KEY (seat_id) REFERENCES seat(seat_id)
);

-- 6. Payments Table
CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
);

-- 7. Seat Locks Table (Temporary for checkout)
CREATE TABLE IF NOT EXISTS seat_locks (
    lock_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    seat_id INT NOT NULL,
    user_id INT NOT NULL,
    locked_until DATETIME NOT NULL,
    UNIQUE(route_id, seat_id)
);

-- View for Revenue Analysis
CREATE OR REPLACE VIEW revenue_by_route_view AS
SELECT 
    r.route_id,
    r.source_city,
    r.destination_city,
    COUNT(b.booking_id) AS total_bookings,
    SUM(p.total_amount) AS total_revenue
FROM route r
LEFT JOIN booking b ON r.route_id = b.route_id AND b.booking_status = 'confirmed'
LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.transaction_status = 'completed'
GROUP BY r.route_id;
