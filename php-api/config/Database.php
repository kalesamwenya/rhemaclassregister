<?php
// File: php-api/config/Database.php

class Database {
    private string $host;
    private string $db;
    private string $user;
    private string $pass;
    private string $charset;
    private bool $debug;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->user = getenv('DB_USER') ?: 'root';
        $this->db   = getenv('DB_NAME') ?: 'rhema_inhouse';
        $this->pass = getenv('DB_PASS') ?: '';
        $this->charset = 'utf8mb4';

        // Enable debug only if explicitly set
        $this->debug = getenv('APP_DEBUG') === 'true';

        if (empty($this->user) || empty($this->db)) {
            throw new Exception("Database configuration missing (DB_USER or DB_NAME).");
        }
    }

    public function connect(): PDO {
        $dsn = "mysql:host={$this->host};dbname={$this->db};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, $this->user, $this->pass, $options);

            // Initialize tables safely
            $this->initialize($pdo);

            return $pdo;

        } catch (PDOException $e) {

            if ($this->debug) {
                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed',
                    'error'   => $e->getMessage()
                ]);
            } else {
                error_log("DB Connection Error: " . $e->getMessage());

                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed'
                ]);
            }

            exit;
        }
    }

    private function initialize(PDO $pdo): void {

        $queries = [

            "CREATE TABLE IF NOT EXISTS students (
                student_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                class VARCHAR(50) NOT NULL,
                payment_status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS course_schedules (
                id VARCHAR(100) PRIMARY KEY,
                course VARCHAR(255) NOT NULL,
                cohort INT NOT NULL,
                cohort_name VARCHAR(100),
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                days VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS course_enrollments (
                schedule_id VARCHAR(100) NOT NULL,
                student_id VARCHAR(50) NOT NULL,
                PRIMARY KEY (schedule_id, student_id),
                FOREIGN KEY (schedule_id) REFERENCES course_schedules(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS rhema_attendance_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                course VARCHAR(255) NOT NULL,
                schedule_id VARCHAR(100) DEFAULT NULL,
                session_cohort VARCHAR(50) DEFAULT NULL,
                profile_cohort VARCHAR(50) DEFAULT NULL,
                date VARCHAR(20) NOT NULL,
                time VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS attendance_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                course VARCHAR(255) NOT NULL,
                schedule_id VARCHAR(100) DEFAULT NULL,
                session_cohort VARCHAR(50) DEFAULT NULL,
                profile_cohort VARCHAR(50) DEFAULT NULL,
                date VARCHAR(20) NOT NULL,
                time VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS payment_alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                course VARCHAR(255) NOT NULL,
                date VARCHAR(20) NOT NULL,
                time VARCHAR(20) NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

            "CREATE TABLE IF NOT EXISTS academic_terms (
                term_id INT PRIMARY KEY,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        ];

        foreach ($queries as $query) {
            try {
                $pdo->exec($query);
            } catch (PDOException $e) {
                error_log("DB Init Error: " . $e->getMessage());
            }
        }
    }
}

function getDBConnection(): PDO {
    static $db = null;

    if ($db === null) {
        $database = new Database();
        $db = $database->connect();
    }

    return $db;
}