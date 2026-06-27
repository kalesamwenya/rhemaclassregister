<?php
declare(strict_types=1);

require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/Database.php';

function readJsonInput(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function getRequestMethod(): string {
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function sanitizeText($value): string {
    return trim(strip_tags((string) ($value ?? '')));
}

function sendJson(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
