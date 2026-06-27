<?php
require_once __DIR__ . '/../config/Api.php';
try {
    getDBConnection()->exec('DELETE FROM rhema_attendance_records');
    getDBConnection()->exec('DELETE FROM attendance_logs');
    sendJson(['success' => true, 'message' => 'Logs purged']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
