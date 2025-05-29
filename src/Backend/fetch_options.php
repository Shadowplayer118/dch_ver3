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

function getDistinct($conn, $column) {
    $values = [];
    $query = "SELECT DISTINCT `$column` FROM inventory WHERE `$column` IS NOT NULL AND `$column` != '' AND is_deleted != 0 ORDER BY `$column` ASC ";
    $result = $conn->query($query);

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $values[] = $row[$column];
        }
    }

    return $values;
}

try {
    $response = [
        'brand' => getDistinct($conn, 'brand'),
        'category' => getDistinct($conn, 'category'),
        'wh_area' => getDistinct($conn, 'wh_area'),
        'store_area' => getDistinct($conn, 'store_area'),
    ];

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch inventory options"]);
}

$conn->close();
