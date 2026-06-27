<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$studentId = sanitizeText($data['student_id'] ?? $_GET['student_id'] ?? '');
$name = sanitizeText($data['name'] ?? $_GET['name'] ?? '');
$class = sanitizeText($data['class'] ?? $_GET['class'] ?? '');
$paymentStatus = sanitizeText($data['payment_status'] ?? $_GET['payment_status'] ?? 'Pending');

if (!$studentId) sendJson(['success' => false, 'message' => 'ID required'], 400);

try {
    $conn = getDBConnection();
    $stmt = $conn->prepare('UPDATE students SET name = :name, class = :class, payment_status = :payment_status WHERE student_id = :student_id');
    $stmt->execute([':student_id' => $studentId, ':name' => $name, ':class' => $class, ':payment_status' => $paymentStatus]);
    sendJson(['success' => true, 'message' => 'Student updated']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
