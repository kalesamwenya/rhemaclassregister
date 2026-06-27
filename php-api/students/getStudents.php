<?php
require_once __DIR__ . '/../config/Api.php';
try {
    $conn = getDBConnection();
    $search = sanitizeText($_GET['search'] ?? '');
    $classFilter = sanitizeText($_GET['class'] ?? '');
    $query = 'SELECT student_id, name, class, payment_status FROM students WHERE 1=1';
    $params = [];
    if ($search !== '') {
        $query .= ' AND (name LIKE :search OR CAST(student_id AS CHAR) LIKE :search)';
        $params[':search'] = '%' . $search . '%';
    }
    if ($classFilter !== '') {
        $query .= ' AND class = :class';
        $params[':class'] = $classFilter;
    }
    $query .= ' ORDER BY student_id DESC';
    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    sendJson(['success' => true, 'data' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()], 500);
}
