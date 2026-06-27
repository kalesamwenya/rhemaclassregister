<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
if (!$data) sendJson(['success' => false, 'message' => 'Empty body'], 400);

try {
    $stmt = getDBConnection()->prepare('INSERT INTO payment_alerts (student_id, name, course, date, time) VALUES (:sid, :n, :c, :d, :t)');
    $stmt->execute([
        ':sid' => sanitizeText($data['student_id']),
        ':n' => sanitizeText($data['name']),
        ':c' => sanitizeText($data['course']),
        ':d' => sanitizeText($data['date']),
        ':t' => sanitizeText($data['time'])
    ]);
    sendJson(['success' => true, 'message' => 'Alert added']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
