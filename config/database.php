<?php
// config/database.php
// FIX: Removed duplicate CORS headers — core.php owns all headers.
// FIX: Database credentials now loaded from .env via core.php.

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // FIX: Read credentials from environment variables set by core.php
        $this->host     = $_ENV['DB_HOST'] ?? 'localhost';
        $this->db_name  = $_ENV['DB_NAME'] ?? 'bus_reservation_system';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        } catch (PDOException $e) {
            // FIX: Never expose connection details to client
            error_log("DB Connection Failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                "status"  => "error",
                "message" => "Database connection failed. Please try again later."
            ]);
            exit();
        }
        return $this->conn;
    }
}
?>
