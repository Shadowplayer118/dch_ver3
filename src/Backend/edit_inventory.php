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

// Required fields
$inventory_id   = getPost($conn, 'inventory_id');
$item_code      = getPost($conn, 'item_code');
$brand          = getPost($conn, 'brand');
$category       = getPost($conn, 'category');
$desc_1         = getPost($conn, 'desc_1');
$desc_2         = getPost($conn, 'desc_2');
$desc_3         = getPost($conn, 'desc_3');
$desc_4         = getPost($conn, 'desc_4');
$units          = (int)getPost($conn, 'units');
$fixed_price    = (float)getPost($conn, 'fixed_price');
$retail_price   = (float)getPost($conn, 'retail_price');
$thresh_hold    = (int)getPost($conn, 'thresh_hold');
$area           = getPost($conn, 'area');
$username       = getPost($conn, 'username');
$user_type      = getPost($conn, 'user_type');
$original_item_code = getPost($conn, 'original_item_code');

if (empty($inventory_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing inventory ID']);
    exit();
}

$response = [];
$tsv = $retail_price * $units;

// Area update
if (!empty($area)) {
    $stmt = $conn->prepare("UPDATE inventory SET area = ?, last_updated = NOW() WHERE inventory_id = ?");
    $stmt->bind_param('si', $area, $inventory_id);
    if ($stmt->execute()) {
        $response[] = 'Area updated';
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update area: ' . $stmt->error]);
        exit();
    }
    $stmt->close();
}

// Units update
if ($units !== '') {
    $stmt = $conn->prepare("UPDATE inventory SET units = ?, last_updated = NOW() WHERE inventory_id = ?");
    $stmt->bind_param('di', $units, $inventory_id); // Corrected 'ii'
    if ($stmt->execute()) {
        $response[] = 'Units updated';
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update units: ' . $stmt->error]);
        exit();
    }
    $stmt->close();
}

// Image upload
$img = null;
$upload_dir = 'Images/';
if (isset($_FILES['img']) && $_FILES['img']['error'] === UPLOAD_ERR_OK) {
    $tmp_name = $_FILES['img']['tmp_name'];
    $original_name = basename($_FILES['img']['name']);
    $extension = pathinfo($original_name, PATHINFO_EXTENSION);
    $date = date('Ymd');
    $randomNumbers = substr(str_shuffle('0123456789'), 0, 10);
    $img = "inventory_image_{$date}_{$randomNumbers}.{$extension}";
    move_uploaded_file($tmp_name, $upload_dir . $img);
}

// Inventory field update based on item_code
if ($img !== null) {
    $sql = "UPDATE inventory SET
        item_code = ?, brand = ?, category = ?, desc_1 = ?, desc_2 = ?, desc_3 = ?, desc_4 = ?,
        fixed_price = ?, retail_price = ?, thresh_hold = ?,
        img = ?, tsv = ?, last_updated = NOW()
        WHERE item_code = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        'sssssssdddsss',
        $item_code, $brand, $category, $desc_1, $desc_2, $desc_3, $desc_4,
        $fixed_price, $retail_price, $thresh_hold,
        $img, $tsv, $original_item_code
    );
} else {
    $sql = "UPDATE inventory SET
        item_code = ?, brand = ?, category = ?, desc_1 = ?, desc_2 = ?, desc_3 = ?, desc_4 = ?,
        fixed_price = ?, retail_price = ?, thresh_hold = ?,
        tsv = ?, last_updated = NOW()
        WHERE item_code = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        'sssssssdddss',
        $item_code, $brand, $category, $desc_1, $desc_2, $desc_3, $desc_4,
        $fixed_price, $retail_price, $thresh_hold,
        $tsv, $original_item_code
    );
}

if ($stmt->execute()) {
    $response[] = 'Inventory details updated';

    $act_performed = "Edited inventory item item code $item_code";
    $log_sql = "INSERT INTO activity_report (
        activity_type, table_performed, act_performed,
        date_performed, time_performed, is_deleted, username, user_type
    ) VALUES (?, ?, ?, NOW(), NOW(), 0, ?, ?)";
    
    $log_stmt = $conn->prepare($log_sql);
    if ($log_stmt) {
        $activity_type = "UPDATE";
        $table_performed = "INVENTORY";
        $log_stmt->bind_param('sssss', $activity_type, $table_performed, $act_performed, $username, $user_type);
        $log_stmt->execute();
        $log_stmt->close();
    }

    echo json_encode(['success' => true, 'message' => implode(', ', $response)]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Update failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
