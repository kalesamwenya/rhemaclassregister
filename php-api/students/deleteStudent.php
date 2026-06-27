<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$studentId = $data['student_id'] ?? $_GET['student_id'] ?? $_POST['student_id'] ?? null;
if (!$studentId) sendJson(['success' => false, 'message' => 'ID required'], 400);

try {
    $stmt = getDBConnection()->prepare('DELETE FROM students WHERE student_id = :id');
    $stmt->execute([':id' => $studentId]);
    sendJson(['success' => true, 'message' => 'Student deleted']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
