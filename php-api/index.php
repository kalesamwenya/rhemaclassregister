<?php
require_once 'config/cors.php';
try {
    require_once 'config/Database.php';
    getDBConnection()->query("SELECT 1");
    $db_status = "Connected";
    $db_color = "green";
} catch (Exception $e) {
    $db_status = "Connection Failed: " . $e->getMessage();
    $db_color = "red";
}
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    echo json_encode(["service" => "Rhema API", "status" => "online", "database" => $db_status]);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head><title>Rhema API Status</title></head>
<body>
    <h1>Rhema Attendance API</h1>
    <p>Database: <span style="color:<?php echo $db_color; ?>"><?php echo $db_status; ?></span></p>
</body>
</html>
