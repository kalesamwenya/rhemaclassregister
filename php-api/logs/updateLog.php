<?php

require_once __DIR__ . '/../config/Api.php';

if (getRequestMethod() !== 'PUT') {
    sendJson(['success' => false, 'message' => 'Method not allowed'], 405);
    exit;
}

$data = readJsonInput();
$id = (int) ($data['id'] ?? 0);
$studentId = sanitizeText($data['student_id'] ?? '');
$name = sanitizeText($data['name'] ?? '');
$course = sanitizeText($data['course'] ?? '');
$scheduleId = sanitizeText($data['schedule_id'] ?? $data['scheduleId'] ?? '');
$sessionCohort = sanitizeText($data['session_cohort'] ?? $data['sessionCohort'] ?? '');
$profileCohort = sanitizeText($data['profile_cohort'] ?? $data['profileCohort'] ?? '');
$date = sanitizeText($data['date'] ?? '');
$time = sanitizeText($data['time'] ?? '');

if ($id <= 0) {
    sendJson(['success' => false, 'message' => 'A valid record id is required'], 400);
    exit;
}

try {
    $db = new Database();
    $conn = $db->connect();

    $conn->exec(
        'CREATE TABLE IF NOT EXISTS rhema_attendance_records (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );

    $stmt = $conn->prepare('UPDATE rhema_attendance_records SET student_id = :student_id, name = :name, course = :course, schedule_id = :schedule_id, session_cohort = :session_cohort, profile_cohort = :profile_cohort, date = :date, time = :time WHERE id = :id');
    $stmt->execute([
        ':student_id' => $studentId,
        ':name' => $name,
        ':course' => $course,
        ':schedule_id' => $scheduleId,
        ':session_cohort' => $sessionCohort,
        ':profile_cohort' => $profileCohort,
        ':date' => $date,
        ':time' => $time,
        ':id' => $id,
    ]);

    sendJson(['success' => true, 'message' => 'Record updated']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => 'Could not update attendance record'], 500);
}
