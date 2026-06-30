<?php
require_once __DIR__ . '/../config/Api.php';

try {
    $conn = getDBConnection();
    $stmt = $conn->prepare('UPDATE payment_alerts SET is_read = 1 WHERE is_read = 0');
    $stmt->execute();
    sendJson(['success' => true, 'message' => 'All alerts marked as read']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
