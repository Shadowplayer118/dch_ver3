<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'db.php';

$data = json_decode(file_get_contents("php://input"));

$username = $data->username ?? '';
$password = $data->password ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Missing credentials"]);
    exit;
}

$sql = "SELECT * FROM user WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($user = $result->fetch_assoc()) {

    // Debug logging (optional, remove in production)
    error_log("Input password: " . $password);
    error_log("DB password: " . $user['password']);

    // Use password_verify if DB password is hashed, else plain check for testing
    if (password_verify($password, $user['password']) || $password === $user['password']) {
        echo json_encode([
            "success" => true,
            "username" => $user['username'],
            "user_type" => $user['user_type']
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}
?>
