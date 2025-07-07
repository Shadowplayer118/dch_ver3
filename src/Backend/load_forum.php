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
$type = getParam($conn, 'type');
$status = getParam($conn, 'status');
$request_date = getParam($conn, 'request_date');
$sortField = getParam($conn, 'sortField') ?: 'f.date_created';
$sortOrder = strtolower(getParam($conn, 'sortOrder')) === 'asc' ? 'ASC' : 'DESC';

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$limit = min(max($limit, 1), 1000);
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

// WHERE conditions
$conditions = [];

if ($search !== '') {
    $conditions[] = "(f.item_code LIKE '%$search%' 
        OR f.text LIKE '%$search%' 
        OR i.desc_1 LIKE '%$search%' 
        OR i.desc_2 LIKE '%$search%' 
        OR i.desc_3 LIKE '%$search%')";
}

if ($type !== '') {
    $conditions[] = "f.type = '$type'";
}

if ($status !== '') {
    $conditions[] = "f.status = '$status'";
}

if ($request_date !== '') {
    $conditions[] = "f.request_date = '$request_date'";
}

$whereClause = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

// Allowable sort fields
$allowedSortFields = ['f.forum_id', 'f.item_code', 'f.date_created', 'f.request_date'];
if (!in_array($sortField, $allowedSortFields)) {
    $sortField = 'f.date_created';
}

// Count total
$totalQuery = "
    SELECT COUNT(*) AS total 
    FROM forum f
    LEFT JOIN inventory i ON f.item_code = i.item_code
    $whereClause
";
$totalResult = $conn->query($totalQuery);
$total = 0;
if ($totalResult && $row = $totalResult->fetch_assoc()) {
    $total = intval($row['total']);
}

// Main data query
$dataQuery = "
    SELECT 
        f.forum_id,
        f.text,
        f.item_code,
        f.location,
        f.type,
        f.request_date,
        f.date_created,
        f.last_updated,
        f.status,
        i.brand,
        i.category,
        i.desc_1,
        i.desc_2,
        i.desc_3,
        i.desc_4,
        i.units,
        i.fixed_price,
        i.retail_price,
        i.img
    FROM forum f
    LEFT JOIN inventory i ON f.item_code = i.item_code
    $whereClause
    ORDER BY $sortField $sortOrder
    LIMIT $limit OFFSET $offset
";

$forums = [];
$dataResult = $conn->query($dataQuery);
if ($dataResult) {
    while ($row = $dataResult->fetch_assoc()) {
        $forums[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch forum data']);
    $conn->close();
    exit();
}

// Fetch all distinct request dates (regardless of current filters)
$dateQuery = "SELECT DISTINCT request_date FROM forum ORDER BY request_date DESC";
$dateResult = $conn->query($dateQuery);
$available_dates = [];

if ($dateResult) {
    while ($dateRow = $dateResult->fetch_assoc()) {
        if (!empty($dateRow['request_date'])) {
            $available_dates[] = $dateRow['request_date'];
        }
    }
}

echo json_encode([
    'data' => $forums,
    'total' => $total,
    'available_dates' => $available_dates
]);

$conn->close();
