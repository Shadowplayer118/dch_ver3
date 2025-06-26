<?php
// Enable CORS for all origins and handle preflight requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db.php';

// Only return active users
$sql = "SELECT DISTINCT username FROM user";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query failed: ' . $conn->error]);
    exit;
}

$data = [];
$data[] = ['username' => '', 'name' => 'All Users']; // default option

while ($row = $result->fetch_assoc()) {
    $username = $row['username'];
    $data[] = [
        'username' => $username,
        'name' => $username // use username as the display name
    ];
}

header('Content-Type: application/json');
echo json_encode($data);

$conn->close();
?>
