<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$studentId = sanitizeText($data['student_id'] ?? '');
$name = sanitizeText($data['name'] ?? '');
$course = sanitizeText($data['course'] ?? '');
$date = sanitizeText($data['date'] ?? '');
$time = sanitizeText($data['time'] ?? '');

if (!$studentId || !$name || !$course || !$date || !$time) {
    sendJson(['success' => false, 'message' => 'Missing fields'], 400);
}

try {
    $conn = getDBConnection();
    $stmt = $conn->prepare('INSERT INTO rhema_attendance_records (student_id, name, course, date, time) VALUES (:sid, :n, :c, :d, :t)');
    $stmt->execute([':sid' => $studentId, ':n' => $name, ':c' => $course, ':d' => $date, ':t' => $time]);
    sendJson(['success' => true, 'message' => 'Log added']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
