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
    if (password_verify($password, $user['password']) || $password === $user['password']) {
        // ✅ Update last_logged and is_active
        $updateSql = "UPDATE user SET last_logged = NOW(), is_active = 1 WHERE username = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->bind_param("s", $username);
        $updateStmt->execute();
        $updateStmt->close();

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

$stmt->close();
$conn->close();
?>
