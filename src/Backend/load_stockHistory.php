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

$search     = getParam($conn, 'search');
$trans_type = getParam($conn, 'trans_type');
$location   = getParam($conn, 'location');
$brand      = getParam($conn, 'brand');
$category   = getParam($conn, 'category');
$start      = getParam($conn, 'start');
$end        = getParam($conn, 'end');

$conditions = [];

$sort_by  = getParam($conn, 'sort_by');
$sort_dir = strtoupper(getParam($conn, 'sort_dir')) === 'ASC' ? 'ASC' : 'DESC';
$allowed_sort_columns = ['stock_id', 'trans_date', 'date_created'];
$sort_column = in_array($sort_by, $allowed_sort_columns) ? $sort_by : 'trans_date';

if ($search !== '') {
    $conditions[] = "(i.item_code LIKE '%$search%' 
                      OR i.desc_1 LIKE '%$search%' 
                      OR i.brand LIKE '%$search%'
                      OR i.category LIKE '%$search%'
                      OR s.requisition_number LIKE '%$search%')";
}

if ($trans_type !== '') {
    $conditions[] = "s.trans_type = '$trans_type'";
}

if ($location !== '' && strtoupper($location) !== 'ALL') {
    $conditions[] = "s.location = '$location'";
}

if ($brand !== '') {
    $conditions[] = "i.brand = '$brand'";
}

if ($category !== '') {
    $conditions[] = "i.category = '$category'";
}

if ($start !== '') {
    $conditions[] = "DATE(s.trans_date) >= '$start'";
}

if ($end !== '') {
    $conditions[] = "DATE(s.trans_date) <= '$end'";
}

$whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

// Main query with hardcoded LIMIT and no OFFSET
$sql = "
    SELECT 
        i.item_code,
        i.desc_1,
        i.brand,
        i.category,
        s.trans_type,   
        s.username,
        s.trans_units,
        s.location,
        s.trans_date,
        s.requisition_number
    FROM stock_history s
    LEFT JOIN (
        SELECT inventory_id, item_code, desc_1, brand, category
        FROM inventory
        WHERE is_deleted = 0
        GROUP BY item_code
    ) i ON s.item_code = i.item_code
    $whereClause
    ORDER BY s.$sort_column $sort_dir
    LIMIT 1000
";

$result = $conn->query($sql);
$history = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }

    echo json_encode([
        'data' => $history
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch stock history']);
}

$conn->close();
