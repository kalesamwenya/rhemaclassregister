<?php
require_once __DIR__ . '/Api.php';
$data = readJsonInput();
if ($data) {
    file_put_contents(__DIR__ . '/../data/sys_config.json', json_encode($data, JSON_PRETTY_PRINT));

    // Also update academic_terms table if terms data is present
    $syncResults = [];
    if (isset($data['terms'])) {
        try {
            require_once __DIR__ . '/Database.php';
            $pdo = getDBConnection();

            // Ensure the table exists (sometimes needed if initialize isn't called)
            $pdo->exec("CREATE TABLE IF NOT EXISTS academic_terms (
                term_id INT PRIMARY KEY,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            $stmt = $pdo->prepare("INSERT INTO academic_terms (term_id, start_date, end_date)
                                 VALUES (?, ?, ?)
                                 ON DUPLICATE KEY UPDATE start_date = VALUES(start_date), end_date = VALUES(end_date)");

            foreach ($data['terms'] as $id => $dates) {
                if (is_numeric($id)) {
                    $startDate = !empty($dates['start']) ? $dates['start'] : null;
                    $endDate = !empty($dates['end']) ? $dates['end'] : null;

                    if ($startDate && $endDate) {
                        $stmt->execute([(int)$id, $startDate, $endDate]);
                        $syncResults[] = "Term $id synced";
                    }
                }
            }
        } catch (Exception $e) {
            sendJson([
                'success' => false,
                'message' => 'Database Sync Failed: ' . $e->getMessage(),
                'json_saved' => true
            ], 500);
        }
    }

    sendJson([
        'success' => true,
        'message' => 'Configuration saved successfully',
        'db_sync' => $syncResults
    ]);
}
sendJson(['success' => false, 'message' => 'No data'], 400);
