<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db.php'; // Adjust path as needed

try {
    if (!isset($_GET['item_code']) || empty($_GET['item_code'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing item_code parameter"]);
        exit();
    }

    $item_code = $_GET['item_code'];
    $location = $_GET['location'];

    $query = "SELECT trans_type, trans_units, location, trans_date 
              FROM stock_history 
              WHERE item_code = ? AND location = ?
              ORDER BY trans_date DESC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $item_code, $location);
    $stmt->execute();
    $result = $stmt->get_result();

    $history = [];
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }

    echo json_encode($history);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch stock history"]);
}

$conn->close();
