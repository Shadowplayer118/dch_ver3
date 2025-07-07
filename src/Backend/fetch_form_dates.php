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

$sql = "SELECT DISTINCT request_date FROM forum WHERE request_date IS NOT NULL ORDER BY request_date DESC";
$result = $conn->query($sql);

$dates = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $dates[] = $row['request_date'];
    }

    echo json_encode($dates);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch request dates']);
}

$conn->close();
