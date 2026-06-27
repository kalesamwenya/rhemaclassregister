<?php
require_once __DIR__ . '/../config/Api.php';
try {
    getDBConnection()->exec('DELETE FROM payment_alerts');
    sendJson(['success' => true, 'message' => 'Alerts purged']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
