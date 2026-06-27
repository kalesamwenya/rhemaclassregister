<?php
require_once __DIR__ . '/../config/Api.php';
try {
    $stmt = getDBConnection()->query('SELECT * FROM payment_alerts ORDER BY id DESC');
    sendJson(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
