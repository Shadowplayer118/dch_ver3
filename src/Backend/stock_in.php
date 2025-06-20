<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
date_default_timezone_set('Asia/Manila');

// Allow preflight requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db.php';

function getPost($conn, $key) {
    return isset($_POST[$key]) ? trim($conn->real_escape_string($_POST[$key])) : '';
}

$inventory_id     = getPost($conn, 'inventory_id');
$item_code        = getPost($conn, 'item_code');
$quantity         = (int)getPost($conn, 'quantity');
$location         = getPost($conn, 'location');
$transaction_date = getPost($conn, 'transaction_date');
$requisition_number = getPost($conn, 'requisition_number');
$username         = getPost($conn, 'username');
$user_type        = getPost($conn, 'user_type');

// Safety check
if (empty($inventory_id) || $quantity <= 0 || empty($location)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid required fields.']);
    exit();
}

// Get current units
$prev_units = 0;
$select_stmt = $conn->prepare("SELECT units FROM inventory WHERE inventory_id = ?");
$select_stmt->bind_param('i', $inventory_id);
$select_stmt->execute();
$select_stmt->bind_result($prev_units);
$select_stmt->fetch();
$select_stmt->close();

$updated_units = $prev_units + $quantity;

// Update units
$update_stmt = $conn->prepare("UPDATE inventory SET units = ?, last_updated = NOW() WHERE inventory_id = ?");
if (!$update_stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
    exit();
}
$update_stmt->bind_param('ii', $updated_units, $inventory_id);

if ($update_stmt->execute()) {
    // Activity log
    $act_performed = "Stock in +$quantity to $location for item_code $item_code (inventory_id $inventory_id)";
    $activity_stmt = $conn->prepare("INSERT INTO activity_report (
        activity_type, table_performed, act_performed,
        date_performed, time_performed, is_deleted, username, user_type, location
    ) VALUES ('STOCK_IN', 'INVENTORY', ?, NOW(), NOW(), 0, ?, ?, ?)");
    if ($activity_stmt) {
        $activity_stmt->bind_param('ssss', $act_performed, $username, $user_type, $location);
        $activity_stmt->execute();
        $activity_stmt->close();
    }

    // Stock history log
    $history_stmt = $conn->prepare("INSERT INTO stock_history (
        inventory_id, trans_type, trans_units, prev_units,
         trans_date, username, user_type,
        location, requisition_number,
        last_updated, date_created, is_deleted, item_code
    ) VALUES (?, 'STOCK IN', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, ?)");
    if ($history_stmt) {
        $history_stmt->bind_param(
            'iiissssss',
            $inventory_id, $quantity, $prev_units,
            $transaction_date, $username, $user_type,
            $location, $requisition_number, $item_code
        );
        $history_stmt->execute();
        $history_stmt->close();
    }

    echo json_encode(['success' => true, 'message' => 'Stock in successful.']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to stock in: ' . $update_stmt->error]);
}

$update_stmt->close();
$conn->close();
