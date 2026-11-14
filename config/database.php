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
        // Read credentials from .env or the hosting environment.
        $this->host     = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
        $this->port     = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '5432';
        $this->db_name  = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'bus_reservation_system';
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'bus_app';
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

            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name}";

            // Verify the server certificate when TLS is enabled (e.g. for Aiven).
            $db_ssl = filter_var($_ENV['DB_SSL'] ?? getenv('DB_SSL') ?? false, FILTER_VALIDATE_BOOLEAN);
            $ssl_ca = __DIR__ . '/../ssl/aiven-ca.pem';
            if ($db_ssl) {
                $dsn .= ';sslmode=verify-full';
                if (file_exists($ssl_ca)) {
                    $dsn .= ';sslrootcert=' . $ssl_ca;
                }
            }

            $this->conn = new PDO(
                $dsn,
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
