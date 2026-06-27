<?php
require_once __DIR__ . '/../config/Api.php';
try {
    $conn = getDBConnection();
    $schedules = $conn->query("SELECT * FROM course_schedules ORDER BY id DESC")->fetchAll();
    $enrollments = [];
    $rows = $conn->query("SELECT schedule_id, student_id FROM course_enrollments")->fetchAll();
    foreach ($rows as $row) {
        $enrollments[$row['schedule_id']][] = $row['student_id'];
    }
    $mapped = array_map(function($s) {
        return [
            'id' => $s['id'],
            'course' => $s['course'],
            'cohort' => (int)$s['cohort'],
            'cohortName' => $s['cohort_name'],
            'startDate' => $s['start_date'],
            'endDate' => $s['end_date'],
            'start' => $s['start_time'],
            'end' => $s['end_time'],
            'days' => array_map('intval', explode(',', $s['days']))
        ];
    }, $schedules);
    sendJson(['success' => true, 'data' => ['schedules' => $mapped, 'enrollments' => $enrollments]]);
} catch(Throwable $e){
    sendJson(['success'=>false, 'message'=>$e->getMessage()], 500);
}
