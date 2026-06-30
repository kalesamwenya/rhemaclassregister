<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();

$studentId = sanitizeText($data['student_id'] ?? $data['id'] ?? '');
$name = sanitizeText($data['name'] ?? '');
$class = sanitizeText($data['class'] ?? $data['cohort'] ?? '');
$paymentStatus = sanitizeText($data['payment_status'] ?? 'Pending');

if (!$studentId) {
    sendJson(['success' => false, 'message' => 'Student ID is required'], 400);
}

try {
    $conn = getDBConnection();

    // Check if student exists first if we want strict update,
    // but for this app's sync logic, an UPSERT is often more reliable.
    $stmt = $conn->prepare('INSERT INTO students (student_id, name, class, payment_status)
                           VALUES (:student_id, :name, :class, :payment_status)
                           ON DUPLICATE KEY UPDATE
                           name = VALUES(name),
                           class = VALUES(class),
                           payment_status = VALUES(payment_status)');

    $stmt->execute([
        ':student_id' => $studentId,
        ':name' => $name,
        ':class' => $class,
        ':payment_status' => $paymentStatus
    ]);

    sendJson(['success' => true, 'message' => 'Student updated successfully']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
}
