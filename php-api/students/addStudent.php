<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$studentId = sanitizeText($data['student_id'] ?? $_POST['student_id'] ?? '');
$name = sanitizeText($data['name'] ?? $_POST['name'] ?? '');
$class = sanitizeText($data['class'] ?? $_POST['class'] ?? '');
$paymentStatus = sanitizeText($data['payment_status'] ?? $_POST['payment_status'] ?? 'Pending');

if (!$studentId || !$name || !$class) {
    sendJson(['success' => false, 'message' => 'Missing fields'], 400);
}

try {
    $conn = getDBConnection();
    $stmt = $conn->prepare('INSERT INTO students (student_id, name, class, payment_status) VALUES (:student_id, :name, :class, :payment_status)');
    $stmt->execute([':student_id' => $studentId, ':name' => $name, ':class' => $class, ':payment_status' => $paymentStatus]);
    sendJson(['success' => true, 'message' => 'Student added']);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
