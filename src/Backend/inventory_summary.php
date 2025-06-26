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

// Get location from GET params
$location = isset($_GET['location']) ? strtoupper(trim($_GET['location'])) : 'ALL';

// Validate location
$validLocations = ['ALL', 'WAREHOUSE', 'STORE'];
if (!in_array($location, $validLocations)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid location']);
    exit;
}

// Build WHERE clause
$where = "is_deleted = 0";
$params = [];
$types = "";

if ($location !== 'ALL') {
    $where .= " AND location = ?";
    $params[] = $location;
    $types .= "s";
}

// --- 1. Item Count ---
$sql_item_count = "SELECT COUNT(*) as item_count FROM inventory WHERE $where";
$stmt1 = $conn->prepare($sql_item_count);
if ($types) $stmt1->bind_param($types, ...$params);
$stmt1->execute();
$res1 = $stmt1->get_result();
$item_count = $res1->fetch_assoc()['item_count'] ?? 0;
$stmt1->close();

// --- 2. Total Value ---
$sql_total_value = "SELECT SUM(units * retail_price) as total_value FROM inventory WHERE $where";
$stmt2 = $conn->prepare($sql_total_value);
if ($types) $stmt2->bind_param($types, ...$params);
$stmt2->execute();
$res2 = $stmt2->get_result();
$total_value = $res2->fetch_assoc()['total_value'] ?? 0.0;
$stmt2->close();

// --- 3. Today's Stock-Ins ---
$today = date('Y-m-d');
$sql_stock_in = "
    SELECT COUNT(*) as stock_in_today 
    FROM activity_report 
    WHERE act_performed LIKE '%Stock in%'  AND DATE(date_performed) = ? AND is_deleted = 0";
$stmt3 = $conn->prepare($sql_stock_in);
$stmt3->bind_param("s", $today);
$stmt3->execute();
$res3 = $stmt3->get_result();
$stock_in_today = $res3->fetch_assoc()['stock_in_today'] ?? 0;
$stmt3->close();

// --- 4. Today's Stock-Outs ---
$sql_stock_out = "
    SELECT COUNT(*) as stock_out_today 
    FROM activity_report 
    WHERE act_performed LIKE '%Stock out%'  AND DATE(date_performed) = ? AND is_deleted = 0";
$stmt4 = $conn->prepare($sql_stock_out);
$stmt4->bind_param("s", $today);
$stmt4->execute();
$res4 = $stmt4->get_result();
$stock_out_today = $res4->fetch_assoc()['stock_out_today'] ?? 0;
$stmt4->close();

// Return response
$response = [
    'item_count' => (int)$item_count,
    'total_value' => round((float)$total_value, 2),
    'stock_in_today' => (int)$stock_in_today,
    'stock_out_today' => (int)$stock_out_today
];

header('Content-Type: application/json');
echo json_encode($response);
$conn->close();
?>
