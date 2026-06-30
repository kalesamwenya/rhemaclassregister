<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$studentIds = $data['student_ids'] ?? [];

if (!is_array($studentIds) || empty($studentIds)) {
    sendJson(['success' => false, 'message' => 'No student IDs provided'], 400);
}

try {
    $conn = getDBConnection();

    // Create placeholders for the IN clause
    $placeholders = implode(',', array_fill(0, count($studentIds), '?'));

    $stmt = $conn->prepare("DELETE FROM students WHERE student_id IN ($placeholders)");
    $stmt->execute($studentIds);

    $count = $stmt->rowCount();
    sendJson(['success' => true, 'message' => "Successfully deleted $count students", 'count' => $count]);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
