<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
date_default_timezone_set('Asia/Manila');

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
$location         = getPost($conn, 'location'); // 'warehouse' or 'store'
$quantity         = (int)getPost($conn, 'quantity');
$updated_units    = (int)getPost($conn, 'updated_units'); // Not used anymore for calculation, kept for compatibility
$transaction_date = getPost($conn, 'transaction_date');
$username         = getPost($conn, 'username');
$user_type        = getPost($conn, 'user_type');

if (empty($inventory_id) || empty($location) || $quantity <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid required fields.']);
    exit();
}

// Fetch current warehouse and store units
$units_sql = "SELECT wh_units, store_units FROM inventory WHERE inventory_id = ?";
$units_stmt = $conn->prepare($units_sql);
if (!$units_stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed to fetch units: ' . $conn->error]);
    exit();
}
$units_stmt->bind_param('i', $inventory_id);
$units_stmt->execute();
$units_stmt->bind_result($wh_units, $store_units);
if (!$units_stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Inventory item not found.']);
    $units_stmt->close();
    exit();
}
$units_stmt->close();

// Validate quantity does not exceed available stock
if ($location === 'warehouse') {
    if ($quantity > $wh_units) {
        http_response_code(400);
        echo json_encode(['error' => 'Quantity exceeds available warehouse units.']);
        $conn->close();
        exit();
    }
    // Calculate new units
    $new_wh_units = $wh_units - $quantity;
    $new_store_units = $store_units + $quantity;

    // Update both warehouse and store units in one query
    $update_sql = "UPDATE inventory SET wh_units = ?, store_units = ?, last_updated = NOW() WHERE inventory_id = ?";
    $update_stmt = $conn->prepare($update_sql);
    if (!$update_stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Prepare failed for warehouse update: ' . $conn->error]);
        $conn->close();
        exit();
    }
    $update_stmt->bind_param('iii', $new_wh_units, $new_store_units, $inventory_id);
    if (!$update_stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Execution failed for warehouse update: ' . $update_stmt->error]);
        $update_stmt->close();
        $conn->close();
        exit();
    }
    $update_stmt->close();
} elseif ($location === 'store') {
    if ($quantity > $store_units) {
        http_response_code(400);
        echo json_encode(['error' => 'Quantity exceeds available store units.']);
        $conn->close();
        exit();
    }
    // Calculate new store units
    $new_store_units = $store_units - $quantity;

    $update_sql = "UPDATE inventory SET store_units = ?, last_updated = NOW() WHERE inventory_id = ?";
    $update_stmt = $conn->prepare($update_sql);
    if (!$update_stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Prepare failed for store update: ' . $conn->error]);
        $conn->close();
        exit();
    }
    $update_stmt->bind_param('ii', $new_store_units, $inventory_id);
    if (!$update_stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'Execution failed for store update: ' . $update_stmt->error]);
        $update_stmt->close();
        $conn->close();
        exit();
    }
    $update_stmt->close();
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid location specified.']);
    $conn->close();
    exit();
}

// Log to activity_report
$act_performed = "Stock out -$quantity from $location for item_code $item_code (inventory_id $inventory_id)";
$log_sql = "INSERT INTO activity_report (
    activity_type, table_performed, act_performed,
    date_performed, time_performed, is_deleted, username, user_type
) VALUES (?, ?, ?, NOW(), NOW(), 0, ?, ?)";

$log_stmt = $conn->prepare($log_sql);
if ($log_stmt) {
    $activity_type = "STOCK_OUT";
    $table_performed = "INVENTORY";
    $log_stmt->bind_param('sssss', $activity_type, $table_performed, $act_performed, $username, $user_type);
    $log_stmt->execute();
    $log_stmt->close();
}

// Insert into stock_history
$history_sql = "INSERT INTO stock_history (
    inventory_id, trans_type, trans_units, prev_units,
    trans_from, trans_date, username, user_type,
    trans_loc, last_updated, date_created, is_deleted
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)";

$history_stmt = $conn->prepare($history_sql);
if ($history_stmt) {
    $trans_type = "STOCK OUT";
    $prev_units = ($location === 'warehouse') ? $wh_units : $store_units;
    $history_stmt->bind_param(
        'isiisssss',
        $inventory_id, $trans_type, $quantity, $prev_units,
        $location, $transaction_date, $username, $user_type, $location
    );
    $history_stmt->execute();
    $history_stmt->close();
}

echo json_encode(['success' => true, 'message' => 'Stock out successful.']);
$conn->close();
?>
