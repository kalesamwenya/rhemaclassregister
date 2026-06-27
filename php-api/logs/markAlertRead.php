<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$id = $data['id'] ?? null;
if (!$id) sendJson(['success' => false, 'message' => 'ID required'], 400);

try {
    getDBConnection()->prepare('UPDATE payment_alerts SET is_read = 1 WHERE id = :id')->execute([':id' => $id]);
    sendJson(['success' => true, 'message' => 'Alert updated']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
