<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();

$studentId = sanitizeText($data['student_id'] ?? $data['id'] ?? $_POST['student_id'] ?? '');
$name = sanitizeText($data['name'] ?? $_POST['name'] ?? '');
$class = sanitizeText($data['class'] ?? $data['cohort'] ?? $_POST['class'] ?? '');
$paymentStatus = sanitizeText($data['payment_status'] ?? $_POST['payment_status'] ?? 'Pending');

if (!$studentId || !$name || !$class) {
    sendJson(['success' => false, 'message' => 'Missing fields: id, name, and class are required'], 400);
}

try {
    $conn = getDBConnection();

    // Use UPSERT logic (Insert or Update if exists)
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

    sendJson(['success' => true, 'message' => 'Student saved successfully']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
}
