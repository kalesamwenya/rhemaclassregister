<?php
require_once __DIR__ . '/../config/Api.php';
$data = readJsonInput();
$students = $data['students'] ?? [];

if (!is_array($students) || empty($students)) {
    sendJson(['success' => false, 'message' => 'No student data provided'], 400);
}

try {
    $conn = getDBConnection();
    $conn->beginTransaction();

    $stmt = $conn->prepare('INSERT INTO students (student_id, name, class, payment_status)
                           VALUES (:student_id, :name, :class, :payment_status)
                           ON DUPLICATE KEY UPDATE name = VALUES(name), class = VALUES(class), payment_status = VALUES(payment_status)');

    $count = 0;
    foreach ($students as $student) {
        $studentId = sanitizeText($student['student_id'] ?? '');
        $name = sanitizeText($student['name'] ?? '');
        $class = sanitizeText($student['class'] ?? '');
        $paymentStatus = sanitizeText($student['payment_status'] ?? 'Pending');

        if ($studentId && $name && $class) {
            $stmt->execute([
                ':student_id' => $studentId,
                ':name' => $name,
                ':class' => $class,
                ':payment_status' => $paymentStatus
            ]);
            $count++;
        }
    }

    $conn->commit();
    sendJson(['success' => true, 'message' => "Successfully processed $count students", 'count' => $count]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
