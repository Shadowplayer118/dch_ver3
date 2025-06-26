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

// Collect input
$inventory_id        = getPost($conn, 'inventory_id');
$item_code           = getPost($conn, 'item_code');
$location            = getPost($conn, 'location');
$quantity            = (int)getPost($conn, 'quantity');
$requisition_number  = getPost($conn, 'requisition_number');
$transaction_date    = getPost($conn, 'transaction_date');
$username            = getPost($conn, 'username');
$user_type           = getPost($conn, 'user_type');

// Basic validation
if (!$inventory_id || !$item_code || !$location || $quantity <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid fields.']);
    exit();
}

// Fetch current units
$stmt = $conn->prepare("SELECT units FROM inventory WHERE inventory_id = ?");
$stmt->bind_param("i", $inventory_id);
$stmt->execute();
$stmt->bind_result($units);

if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['error' => 'Inventory item not found.']);
    $stmt->close();
    exit();
}   
$stmt->close();

// Compute new units
$new_units = $units - $quantity;
$update = $conn->prepare("UPDATE inventory SET units = ?, last_updated = NOW() WHERE inventory_id = ?");
$update->bind_param("ii", $new_units, $inventory_id);

if (!$update->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Update failed: ' . $update->error]);
    $update->close();
    exit();
}
$update->close();

// Activity log
$act_performed = "Stock out -$quantity from $location for item_code $item_code (inventory_id $inventory_id)";
$log = $conn->prepare("INSERT INTO activity_report (
    activity_type, table_performed, act_performed,
    date_performed, time_performed, is_deleted, username, user_type, location
) VALUES ('STOCK_OUT', 'INVENTORY', ?, NOW(), NOW(), 0, ?, ?, ?)");
$log->bind_param("ssss", $act_performed, $username, $user_type, $location);
$log->execute();
$log->close();

// Stock history insert (MATCHING PARAMS)
$trans_type = "STOCK OUT";
$prev_units = $units;

$hist = $conn->prepare("INSERT INTO stock_history (
    inventory_id, trans_type, trans_units, prev_units,
    trans_date, username, user_type,
    location, last_updated, date_created, is_deleted, item_code, requisition_number
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, ?, ?)");

$hist->bind_param(
    "isiissssss",
    $inventory_id,         // i
    $trans_type,           // s
    $quantity,             // i
    $prev_units,           // i
    $transaction_date,     // s
    $username,             // s
    $user_type,            // s
    $location,             // s (trans_loc)
    $item_code,            // s
    $requisition_number    // s
);


$hist->execute();
$hist->close();


if (strtoupper($location) === 'WAREHOUSE') {
    // Find the STORE entry with the same item_code
    $storeQuery = $conn->prepare("SELECT inventory_id, units FROM inventory WHERE item_code = ? AND location = 'STORE' LIMIT 1");
    $storeQuery->bind_param("s", $item_code);
    $storeQuery->execute();
    $storeQuery->bind_result($store_id, $store_units);

    if ($storeQuery->fetch()) {
        $storeQuery->close();
        $updated_store_units = $store_units + $quantity;

        // Update the store units
        $updateStore = $conn->prepare("UPDATE inventory SET units = ?, last_updated = NOW() WHERE inventory_id = ?");
        $updateStore->bind_param("ii", $updated_store_units, $store_id);
        $updateStore->execute();
        $updateStore->close();

        // Log store-side stock in
        $trans_type_store = "STOCK IN (FROM WAREHOUSE)";
        $histStore = $conn->prepare("INSERT INTO stock_history (
            inventory_id, trans_type, trans_units, prev_units,
            trans_date, username, user_type,
            location, last_updated, date_created, is_deleted, item_code, requisition_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0, ?, ?)");

        $histStore->bind_param(
            "isiissssss",
            $store_id,              // i
            $trans_type_store,      // s
            $quantity,              // i
            $store_units,           // i (previous units before update)
            $transaction_date,      // s
            $username,              // s
            $user_type,             // s
            'STORE',                // s
            $item_code,             // s
            $requisition_number     // s
        );

        $histStore->execute();
        $histStore->close();
    } else {
        $storeQuery->close();
        // Optional logging if STORE item not found
        error_log("No matching STORE inventory for item_code: $item_code");
    }
}


// Response
echo json_encode(['success' => true, 'message' => 'Stock out successful.']);
$conn->close();
?>
