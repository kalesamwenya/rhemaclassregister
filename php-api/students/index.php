<?php
require_once __DIR__ . '/../config/Api.php';
$method = getRequestMethod();
try {
    $pdo = getDBConnection();
    if ($method === "GET") {
        sendJson(["success" => true, "data" => $pdo->query("SELECT * FROM students ORDER BY student_id DESC")->fetchAll()]);
    }
    if ($method === "POST" || $method === "PUT") {
        $input = readJsonInput();
        $stmt = $pdo->prepare("INSERT INTO students (student_id, name, class, payment_status) VALUES (:id, :n, :c, :p) ON DUPLICATE KEY UPDATE name=:n, class=:c, payment_status=:p");
        $stmt->execute([':id'=>$input['student_id'], ':n'=>$input['name'], ':c'=>$input['class'], ':p'=>$input['payment_status']??'Pending']);
        sendJson(["success" => true, "message" => "Saved"]);
    }
    if ($method === "DELETE") {
        $id = $_GET['student_id'] ?? readJsonInput()['student_id'] ?? null;
        $pdo->prepare("DELETE FROM students WHERE student_id = :id")->execute([':id'=>$id]);
        sendJson(["success" => true, "message" => "Deleted"]);
    }
} catch (Exception $e) {
    sendJson(["success" => false, "message" => $e->getMessage()], 500);
}
