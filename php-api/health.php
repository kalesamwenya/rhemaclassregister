<?php

require_once __DIR__ . '/config/Api.php';

$dbStatus = 'unknown';
try {
    $db = new Database();
    $conn = $db->connect();
    $dbStatus = 'connected';
} catch (Throwable $e) {
    $dbStatus = 'failed: ' . $e->getMessage();
}

sendJson([
    'success' => true,
    'service' => 'rhema-attendance-api',
    'status' => 'ok',
    'database' => $dbStatus,
    'timestamp' => date('c'),
    'endpoints' => [
        'students' => '/students/getStudents.php',
        'student_create' => '/students/addStudent.php',
        'student_update' => '/students/updateStudent.php',
        'student_delete' => '/students/deleteStudent.php',
        'login' => '/auth/login.php',
        'schedules' => '/schedules/getSchedules.php',
        'sync_schedules' => '/schedules/syncSchedules.php',
        'logs' => '/logs/getLogs.php',
        'config' => '/config/getConfig.php',
    ],
]);
