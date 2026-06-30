<?php
require_once __DIR__ . '/../config/Api.php';
try {
    // Join attendance records with students table to get complete data
    $query = '
        SELECT 
            r.id,
            r.student_id,
            COALESCE(s.name, r.name) as name,
            r.course,
            r.schedule_id,
            r.session_cohort,
            COALESCE(s.class, r.profile_cohort) as profile_cohort,
            r.date,
            r.time,
            r.created_at
        FROM rhema_attendance_records r
        LEFT JOIN students s ON r.student_id = s.student_id
        ORDER BY r.date DESC, r.time DESC
    ';
    
    $stmt = getDBConnection()->query($query);
    sendJson(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
