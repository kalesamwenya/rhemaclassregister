<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();

$studentId = sanitizeText($data['student_id'] ?? '');
$name = sanitizeText($data['name'] ?? '');
$course = sanitizeText($data['course'] ?? '');
$scheduleId = sanitizeText($data['schedule_id'] ?? $data['scheduleId'] ?? '');
$sessionCohort = sanitizeText($data['session_cohort'] ?? $data['sessionCohort'] ?? '');
$profileCohort = sanitizeText($data['profile_cohort'] ?? $data['profileCohort'] ?? '');
$date = sanitizeText($data['date'] ?? '');
$time = sanitizeText($data['time'] ?? '');

if (!$studentId || !$name || !$course || !$date || !$time) {
    sendJson(['success' => false, 'message' => 'Missing required fields'], 400);
}

try {
    $conn = getDBConnection();
    $stmt = $conn->prepare('INSERT INTO rhema_attendance_records (student_id, name, course, schedule_id, session_cohort, profile_cohort, date, time)
                           VALUES (:sid, :n, :c, :sched, :sess, :prof, :d, :t)');

    $stmt->execute([
        ':sid' => $studentId,
        ':n' => $name,
        ':c' => $course,
        ':sched' => $scheduleId,
        ':sess' => $sessionCohort,
        ':prof' => $profileCohort,
        ':d' => $date,
        ':t' => $time
    ]);

    // Also log to attendance_logs for redundant history if needed
    $stmt2 = $conn->prepare('INSERT INTO attendance_logs (student_id, name, course, schedule_id, session_cohort, profile_cohort, date, time)
                            VALUES (:sid, :n, :c, :sched, :sess, :prof, :d, :t)');
    $stmt2->execute([
        ':sid' => $studentId,
        ':n' => $name,
        ':c' => $course,
        ':sched' => $scheduleId,
        ':sess' => $sessionCohort,
        ':prof' => $profileCohort,
        ':d' => $date,
        ':t' => $time
    ]);

    sendJson(['success' => true, 'message' => 'Log added successfully']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
