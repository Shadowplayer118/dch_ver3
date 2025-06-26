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
    if (!isset($_GET['prefix']) || empty($_GET['prefix'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing prefix parameter"]);
        exit();
    }

    $prefix = $_GET['prefix'];

    $query = "SELECT item_code 
              FROM inventory 
              WHERE item_code LIKE CONCAT(?, '%') 
              ORDER BY item_code DESC 
              LIMIT 1";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $prefix);
    $stmt->execute();
    $result = $stmt->get_result();

    $row = $result->fetch_assoc();

    echo json_encode($row ? $row['item_code'] : null);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to fetch item_code"]);
}

$conn->close();
