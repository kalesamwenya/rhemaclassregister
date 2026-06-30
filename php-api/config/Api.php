<?php
// FILE: php-api/config/Api.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/Database.php';

/**
 * Gets the HTTP request method.
 */
function getRequestMethod(): string {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Reads JSON input from the request body.
 */
function readJsonInput(): array {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

/**
 * Sanitizes input text.
 */
function sanitizeText(?string $text): string {
    if ($text === null) return '';
    return htmlspecialchars(strip_tags(trim($text)));
}

/**
 * Sends a JSON response and exits.
 */
function sendJson(array $data, int $code = 200): void {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    echo json_encode($data);
    exit();
}
