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

// Get filters
$search = getParam($conn, 'search');
$brand = getParam($conn, 'brand');
$category = getParam($conn, 'category');
$desc1 = getParam($conn, 'desc_1');
$desc4 = getParam($conn, 'desc_4');
$area = getParam($conn, 'area');
$location = strtoupper(getParam($conn, 'location'));

// Pagination
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 500;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

// Sorting
$allowedSortFields = ['item_code', 'brand', 'category', 'desc_1', 'units', 'fixed_price', 'retail_price', 'inventory_id'];
$sortField = in_array(getParam($conn, 'sortField'), $allowedSortFields) ? getParam($conn, 'sortField') : 'inventory_id';
$sortOrder = strtolower(getParam($conn, 'sortOrder')) === 'asc' ? 'ASC' : 'DESC';

// Build WHERE clause
$conditions = [];
$conditions[] = "is_deleted != 1";

if ($search !== '') {
    $searchEscaped = $conn->real_escape_string($search);
    $conditions[] = "(item_code LIKE '%$searchEscaped%' 
                      OR desc_1 LIKE '%$searchEscaped%' 
                      OR desc_2 LIKE '%$searchEscaped%' 
                      OR desc_3 LIKE '%$searchEscaped%' 
                      OR desc_4 LIKE '%$searchEscaped%'
                      OR brand LIKE '%$searchEscaped%'
                      OR category LIKE '%$searchEscaped%'
                      OR CONCAT(desc_1, ' ', desc_2, ' ', desc_3) LIKE '%$searchEscaped%')";
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
    $conditions[] = "(area = '$area')";
}

if ($location === 'STORE') {
    $conditions[] = "location = 'STORE'";
} elseif ($location === 'WAREHOUSE') {
    $conditions[] = "location = 'WAREHOUSE'";
}

$whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

// Get total count
$totalQuery = "SELECT COUNT(*) AS total FROM inventory $whereClause";
$totalResult = $conn->query($totalQuery);
$total = 0;
if ($totalResult && $row = $totalResult->fetch_assoc()) {
    $total = intval($row['total']);
}

// Get inventory data
$sql = "SELECT * FROM inventory $whereClause ORDER BY $sortField $sortOrder LIMIT $limit OFFSET $offset";
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
