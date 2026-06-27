<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$id = $data['id'] ?? $_GET['id'] ?? null;
if (!$id) sendJson(['success' => false, 'message' => 'ID required'], 400);

try {
    getDBConnection()->prepare("DELETE FROM course_schedules WHERE id = :id")->execute([':id' => $id]);
    sendJson(['success' => true, 'message' => 'Deleted']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
