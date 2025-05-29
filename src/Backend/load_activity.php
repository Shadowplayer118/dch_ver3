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
$startDate = getParam($conn, 'start_date');
$endDate = getParam($conn, 'end_date');

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
$offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;

$conditions = [];

if ($search !== '') {
    $conditions[] = "(activity_type LIKE '%$search%' 
                     OR act_performed LIKE '%$search%' 
                     OR username LIKE '%$search%' 
                     OR user_type LIKE '%$search%')";
}

if ($startDate !== '') {
    $conditions[] = "date_performed >= '$startDate'";
}

if ($endDate !== '') {
    $conditions[] = "date_performed <= '$endDate'";
}

$whereClause = count($conditions) ? "WHERE " . implode(" AND ", $conditions) : "";

// Total count for pagination
$totalQuery = "SELECT COUNT(*) AS total FROM activity_report $whereClause";
$totalResult = $conn->query($totalQuery);
$total = 0;
if ($totalResult && $row = $totalResult->fetch_assoc()) {
    $total = intval($row['total']);
}

// Fetch filtered activity reports
$sql = "
    SELECT 
        activity_type,
        act_performed,
        username,
        user_type,
        date_performed,
        time_performed
    FROM activity_report
    $whereClause
    ORDER BY date_performed DESC, time_performed DESC
    LIMIT $limit OFFSET $offset
";

$result = $conn->query($sql);

$reports = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }

    echo json_encode([
        'data' => $reports,
        'total' => $total
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch activity reports']);
}

$conn->close();
