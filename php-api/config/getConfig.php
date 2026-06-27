<?php
require_once __DIR__ . '/Api.php';
$path = __DIR__ . '/../data/sys_config.json';
$default = [
    'themeMode' => 'light',
    'primaryColor' => '#3b82f6',
    'textCustoms' => [
        'lbl-gate-title' => 'Rhema Class Attendance',
        'lbl-gate-subtitle' => 'Secure checkpoint management console & kiosk logger',
        'lbl-gate-student-card-title' => 'Student Check-In Kiosk',
        'lbl-gate-admin-card-title' => 'System Administrator',
        'lbl-sidebar-brand-title' => 'Rhema Console',
        'lbl-terminal-title' => 'Rhema Check-In Terminal',
    ],
    'cohorts' => ['1' => 'FYM', '2' => 'FYE', '3' => 'SYM', '4' => 'SYE'],
];
if (is_file($path)) {
    $data = json_decode(file_get_contents($path), true);
    if ($data) sendJson(['success' => true, 'data' => $data]);
}
sendJson(['success' => true, 'data' => $default]);
