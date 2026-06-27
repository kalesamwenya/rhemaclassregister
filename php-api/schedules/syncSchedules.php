<?php
require_once __DIR__ . '/../config/Api.php';
$body = readJsonInput();
$schedules = $body['schedules'] ?? [];
$enrollments = $body['enrollments'] ?? [];

try {
    $conn = getDBConnection();
    $conn->beginTransaction();
    $conn->exec("DELETE FROM course_enrollments");
    $conn->exec("DELETE FROM course_schedules");

    $sStmt = $conn->prepare("INSERT INTO course_schedules (id, course, cohort, cohort_name, start_date, end_date, start_time, end_time, days) VALUES (:id, :c, :ch, :cn, :sd, :ed, :st, :et, :d)");
    foreach ($schedules as $s) {
        $sStmt->execute([
            ':id' => $s['id'],
            ':c' => $s['course'],
            ':ch' => $s['cohort'],
            ':cn' => $s['cohortName'] ?? '',
            ':sd' => $s['startDate'],
            ':ed' => $s['endDate'],
            ':st' => $s['start'],
            ':et' => $s['end'],
            ':d' => implode(',', $s['days'])
        ]);
    }

    $eStmt = $conn->prepare("INSERT INTO course_enrollments (schedule_id, student_id) SELECT :sid, :sid_p WHERE EXISTS (SELECT 1 FROM students WHERE student_id = :sid_p)");
    foreach ($enrollments as $sid => $students) {
        foreach ($students as $student_id) {
            $eStmt->execute([':sid' => $sid, ':sid_p' => $student_id]);
        }
    }
    $conn->commit();
    sendJson(['success' => true, 'message' => 'Synced']);
} catch (Throwable $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
