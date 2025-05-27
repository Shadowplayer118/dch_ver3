<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db.php'; // Update path if needed

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit();
}

$inventory_id = isset($input['inventory_id']) ? intval($input['inventory_id']) : 0;
$username = isset($input['username']) ? $conn->real_escape_string(trim($input['username'])) : '';
$user_type = isset($input['user_type']) ? $conn->real_escape_string(trim($input['user_type'])) : '';

if (!$inventory_id || !$username || !$user_type) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
    exit();
}

// Start transaction to ensure data integrity
$conn->begin_transaction();

try {
    // Update inventory: soft delete
    $updateSql = "UPDATE inventory SET is_deleted = 1 WHERE inventory_id = ?";
    $stmt = $conn->prepare($updateSql);
    if (!$stmt) {
        throw new Exception("Failed to prepare inventory update");
    }
    $stmt->bind_param('i', $inventory_id);
    if (!$stmt->execute()) {
        throw new Exception("Failed to update inventory item");
    }
    date_default_timezone_set('Asia/Manila');
    // Log activity
    $activity = "Deleted inventory item ID $inventory_id";
    $date_performed = date('Y-m-d');
    $activity_type = "DELETE";
    $time_performed = date('H:i:s'); 
    $logSql = "INSERT INTO activity_report (username, user_type, act_performed, date_performed, activity_type, time_performed, is_deleted, table_performed) VALUES (?, ?, ?, ?, ?, ?, 0, 'INVENTORY')";
    $logStmt = $conn->prepare($logSql);
    if (!$logStmt) {
        throw new Exception("Failed to prepare activity log");
    }
    $logStmt->bind_param('ssssss', $username, $user_type, $activity, $date_performed, $activity_type, $time_performed);
    if (!$logStmt->execute()) {
        throw new Exception("Failed to insert activity log");
    }

    $conn->commit();

    echo json_encode(['success' => true, 'message' => 'Item deleted and activity recorded']);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
