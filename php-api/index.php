<?php
require_once __DIR__ . '/config/Api.php';

$dbStatus = 'unknown';
$dbColor = 'gray';
$success = false;

try {
    $conn = getDBConnection();
    $conn->query("SELECT 1");
    $dbStatus = 'Connected';
    $dbColor = 'green';
    $success = true;
} catch (Throwable $e) {
    $dbStatus = 'Connection Failed: ' . $e->getMessage();
    $dbColor = 'red';
}

if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    sendJson([
        "service" => "Rhema Attendance API",
        "status" => $success ? "online" : "error",
        "database" => $dbStatus
    ]);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rhema API Status</title>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f4f9; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #333; margin-top: 0; }
        .status { font-weight: bold; padding: 0.5rem 1rem; border-radius: 4px; display: inline-block; margin-top: 1rem; }
        .online { background: #e6fffa; color: #047481; }
        .error { background: #fff5f5; color: #c53030; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Rhema Attendance API</h1>
        <p>Database: <span style="color:<?php echo $dbColor; ?>"><?php echo $dbStatus; ?></span></p>
        <div class="status <?php echo $success ? 'online' : 'error'; ?>">
            API is <?php echo $success ? 'Online' : 'Offline'; ?>
        </div>
    </div>
</body>
</html>
