<?php
// Enable CORS for all origins and handle preflight requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Handle preflight request
    http_response_code(200);
    exit();
}

include '../db.php';

// Get parameters from query string (GET)
$username = isset($_GET['username']) ? $_GET['username'] : null;
$yearweek = isset($_GET['yearweek']) ? $_GET['yearweek'] : null; // Format: YYYYWW

// If no yearweek provided, default to current week
if (!$yearweek) {
    $year = date('Y');
    $week = date('W');
    $yearweek = $year . str_pad($week, 2, '0', STR_PAD_LEFT);
}

// Base SQL query
$sql = "
SELECT 
    DAYNAME(date_performed) AS day_name,
    DATE(date_performed) AS day_date,
    SUM(activity_type = 'INSERT') AS insert_count,
    SUM(activity_type = 'UPDATE') AS update_count,
    SUM(activity_type = 'DELETE') AS delete_count,
    SUM(activity_type = 'STOCK_IN') AS stock_in_count,
    SUM(activity_type = 'STOCK_OUT') AS stock_out_count
FROM activity_report
WHERE 
    YEARWEEK(date_performed, 1) = ?
    AND is_deleted = 0
";

// Add username filtering if provided
if ($username) {
    $sql .= " AND username = ? ";
}

$sql .= " GROUP BY day_date ORDER BY day_date";

// Prepare statement
$stmt = $conn->prepare($sql);

if ($username) {
    $stmt->bind_param('ss', $yearweek, $username);
} else {
    $stmt->bind_param('s', $yearweek);
}

$stmt->execute();

$result = $stmt->get_result();

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    exit;
}

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = [
        'day_name' => $row['day_name'],
        'day_date' => $row['day_date'],
        'insert_count' => (int)$row['insert_count'],
        'update_count' => (int)$row['update_count'],
        'delete_count' => (int)$row['delete_count'],
        'stock_in_count' => (int)$row['stock_in_count'],
        'stock_out_count' => (int)$row['stock_out_count'],
    ];
}

header('Content-Type: application/json');
echo json_encode($data);

$stmt->close();
$conn->close();
?>
