<?php
// File: php-api/config/Database.php

class Database {
    private string $host;
    private string $db;
    private string $user;
    private string $pass;
    private string $charset;

    public function __construct() {
        // Use environment variables or Hostinger defaults
        $this->host = getenv('DB_HOST') ?: 'localhost';

        // Hostinger User
        $this->user = getenv('DB_USER') ?: 'u164973018_rhamazambia';

        // Hostinger Database
        $this->db   = getenv('DB_NAME') ?: 'u164973018_rhema_inhouse';

        // IMPORTANT: Fill your database password here or set DB_PASS environment variable
        $this->pass = getenv('DB_PASS') ?: '';

        $this->charset = 'utf8mb4';
    }

    public function connect(): PDO {
        $dsn = "mysql:host={$this->host};dbname={$this->db};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $pdo = new PDO($dsn, $this->user, $this->pass, $options);

            // Optional: Auto-create tables if they don't exist
            $this->initialize($pdo);

            return $pdo;
        } catch (PDOException $e) {
            // Send back a clean error if database connection fails
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed',
                'error' => $e->getMessage()
            ]);
            exit;
        }
    }

    private function initialize(PDO $pdo): void {
        // Tables list as previously defined
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
            } catch (Exception $e) {}
        }
    }
}

function getDBConnection(): PDO {
    $db = new Database();
    return $db->connect();
}
