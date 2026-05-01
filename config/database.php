<?php
// config/database.php
// FIX: Removed duplicate CORS headers — core.php owns all headers.
// FIX: Database credentials now loaded from .env via core.php.

class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // FIX: Read credentials from environment variables (works with .env or platform env)
        $this->host     = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
        $this->port     = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
        $this->db_name  = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'bus_reservation_system';
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
        $this->password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            // Add SSL CA only if DB_SSL is true (e.g. for Aiven)
            $db_ssl = filter_var($_ENV['DB_SSL'] ?? getenv('DB_SSL') ?? false, FILTER_VALIDATE_BOOLEAN);
            $ssl_ca = __DIR__ . '/../ssl/aiven-ca.pem';
            
            if ($db_ssl && file_exists($ssl_ca)) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $ssl_ca;
            }

            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                $options
            );
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
