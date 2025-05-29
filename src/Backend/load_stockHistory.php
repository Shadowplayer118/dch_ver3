<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db.php';

function getParam($conn, $key) {
    return isset($_GET[$key]) ? trim($conn->real_escape_string($_GET[$key])) : '';
}

$search = getParam($conn, 'search');
$trans_type = getParam($conn, 'trans_type');
$trans_from = getParam($conn, 'trans_from');
$brand = getParam($conn, 'brand');
$category = getParam($conn, 'category');

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 500;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$conditions = [];

if ($search !== '') {
    $conditions[] = "(i.item_code LIKE '%$search%' 
                      OR i.desc_1 LIKE '%$search%' 
                      OR i.brand LIKE '%$search%'
                      OR i.category LIKE '%$search%')";
}

if ($trans_type !== '') {
    $conditions[] = "s.trans_type = '$trans_type'";
}

if ($trans_from !== '') {
    $conditions[] = "s.trans_from = '$trans_from'";
}

if ($brand !== '') {
    $conditions[] = "i.brand = '$brand'";
}

if ($category !== '') {
    $conditions[] = "i.category = '$category'";
}

$whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

// Get total count for pagination
$totalQuery = "
    SELECT COUNT(*) AS total 
    FROM stock_history s
    LEFT JOIN inventory i ON s.inventory_id = i.inventory_id
    $whereClause
";
$totalResult = $conn->query($totalQuery);
$total = 0;
if ($totalResult && $row = $totalResult->fetch_assoc()) {
    $total = intval($row['total']);
}

// Main query to get stock history with inventory details
$sql = "
    SELECT 
        i.item_code,
        i.desc_1,
        i.brand,
        i.category,
        s.trans_type,
        s.trans_units,
        s.trans_from,
        s.trans_date
    FROM stock_history s
    LEFT JOIN inventory i ON s.inventory_id = i.inventory_id
    $whereClause
    ORDER BY s.trans_date DESC
    LIMIT $limit OFFSET $offset
";

$result = $conn->query($sql);

$history = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }

    echo json_encode([
        'data' => $history,
        'total' => $total
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch stock history']);
}

$conn->close();
