<?php
require_once __DIR__ . '/Api.php';
$data = readJsonInput();
if ($data) {
    file_put_contents(__DIR__ . '/../data/sys_config.json', json_encode($data, JSON_PRETTY_PRINT));
    sendJson(['success' => true, 'message' => 'Saved']);
}
sendJson(['success' => false, 'message' => 'No data'], 400);
