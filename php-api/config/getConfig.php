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
    'terms' => [
        '1' => ['start' => '', 'end' => ''],
        '2' => ['start' => '', 'end' => ''],
        '3' => ['start' => '', 'end' => ''],
        '4' => ['start' => '', 'end' => ''],
    ],
];
if (is_file($path)) {
    $data = json_decode(file_get_contents($path), true);
    if ($data) $default = array_merge($default, $data);
}

// Merge academic_terms from database if available
try {
    require_once __DIR__ . '/Database.php';
    $pdo = getDBConnection();

    // Ensure table exists for retrieval too
    $pdo->exec("CREATE TABLE IF NOT EXISTS academic_terms (
        term_id INT PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->query("SELECT * FROM academic_terms");
    $dbTerms = [];
    while ($row = $stmt->fetch()) {
        $dbTerms[(string)$row['term_id']] = ['start' => $row['start_date'], 'end' => $row['end_date']];
    }

    if (!empty($dbTerms)) {
        // If we have DB terms, they take precedence or fill in gaps
        if (!isset($default['terms'])) $default['terms'] = [];
        foreach ($dbTerms as $tid => $dates) {
            $default['terms'][$tid] = $dates;
        }
    }
} catch (Exception $e) {
    // Optional: Log $e->getMessage()
}

sendJson(['success' => true, 'data' => $default]);
