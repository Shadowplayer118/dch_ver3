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

// Helper to get trimmed GET param or empty string
function getParam($conn, $key) {
    return isset($_GET[$key]) ? trim($conn->real_escape_string($_GET[$key])) : '';
}

$search = getParam($conn, 'search');
$brand = getParam($conn, 'brand');
$category = getParam($conn, 'category');
$desc1 = getParam($conn, 'desc_1');
$desc4 = getParam($conn, 'desc_4');
$area = getParam($conn, 'area');

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 500;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$conditions = [];

// Add condition to exclude deleted records (is_deleted != 0)
$conditions[] = "is_deleted != 1";

if ($search !== '') {
    $conditions[] = "(item_code LIKE '%$search%' 
                      OR desc_1 LIKE '%$search%' 
                      OR desc_2 LIKE '%$search%' 
                      OR desc_3 LIKE '%$search%' 
                      OR desc_4 LIKE '%$search%'
                      OR brand LIKE '%$search%'
                      OR category LIKE '%$search%'
                      OR CONCAT(desc_1, ' ', desc_2, ' ', desc_3) LIKE '%$search%')";
}

if ($brand !== '') {
    $conditions[] = "brand = '$brand'";
}

if ($category !== '') {
    $conditions[] = "category = '$category'";
}

if ($desc1 !== '') {
    $conditions[] = "desc_1 = '$desc1'";
}

if ($desc4 !== '') {
    $conditions[] = "desc_4 = '$desc4'";
}

if ($area !== '') {
    // More explicit condition
    $conditions[] = "(wh_area = '$area' OR store_area = '$area')";
}

$whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

// Total count for pagination
$totalQuery = "SELECT COUNT(*) AS total FROM inventory $whereClause";
$totalResult = $conn->query($totalQuery);
$total = 0;

if ($totalResult && $row = $totalResult->fetch_assoc()) {
    $total = intval($row['total']);
}

// Main data query with LIMIT + OFFSET
$sql = "SELECT * FROM inventory $whereClause ORDER BY inventory_id DESC LIMIT $limit OFFSET $offset";
$result = $conn->query($sql);

$inventory = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $inventory[] = $row;
    }

    echo json_encode([
        'data' => $inventory,
        'total' => $total
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch inventory data"]);
}

$conn->close();
