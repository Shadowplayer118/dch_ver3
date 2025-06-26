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

$item_code     = getPost($conn, 'item_code'); // <-- now coming from frontend
$brand         = getPost($conn, 'brand');
$category      = getPost($conn, 'category');
$desc_1        = getPost($conn, 'desc_1');
$desc_2        = getPost($conn, 'desc_2');
$desc_3        = getPost($conn, 'desc_3');
$desc_4        = getPost($conn, 'desc_4');
$retail_price  = (float)getPost($conn, 'retail_price');
$fixed_price   = (float)getPost($conn, 'fixed_price');
$units         = (float)getPost($conn, 'units');
$area          = getPost($conn, 'area');
$thresh_hold   = getPost($conn, 'thresh_hold');
$username      = getPost($conn, 'username');
$user_type     = getPost($conn, 'user_type');
$location      = getPost($conn, 'location');

$tsv = $retail_price * $units;
$is_deleted = 0;

// ==== HANDLE IMAGE UPLOAD ====
$img = 'default_autoparts.png';
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

// ==== INSERT INTO INVENTORY ====
$sql = "INSERT INTO inventory (
    item_code, brand, category, desc_1, desc_2, desc_3, desc_4,
    retail_price, fixed_price, units,
    area, thresh_hold, img,
    tsv, is_deleted, date_created, last_updated, location
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database prepare failed: ' . $conn->error]);
    exit();
}

$stmt->bind_param(
    'sssssssdddsisdis',
    $item_code, $brand, $category, $desc_1, $desc_2, $desc_3, $desc_4,
    $retail_price, $fixed_price, $units,
    $area, $thresh_hold, $img,
    $tsv, $is_deleted, $location
);

if ($stmt->execute()) {
    // ==== LOG ACTIVITY ====
    $act_performed = "INSERT INTO inventory (...) VALUES (
        '$item_code', '$brand', '$category', '$desc_1', '$desc_2', '$desc_3', '$desc_4',
        $retail_price, $fixed_price, $units, '$area', '$thresh_hold', '$img',
        $tsv, $is_deleted, NOW(), NOW(), '$location')";

    $log_sql = "INSERT INTO activity_report (
        activity_type, table_performed, act_performed,
        date_performed, time_performed, is_deleted, username, user_type
    ) VALUES (?, ?, ?, NOW(), NOW(), 0, ?, ?)";

    $log_stmt = $conn->prepare($log_sql);
    if ($log_stmt) {
        $activity_type = "INSERT";
        $table_performed = "INVENTORY";
        $log_stmt->bind_param('sssss', $activity_type, $table_performed, $act_performed, $username, $user_type);
        $log_stmt->execute();
        $log_stmt->close();
    }

    echo json_encode(['success' => true, 'message' => 'Item added successfully.']);

    // ==== DUPLICATE TO OPPOSITE LOCATION ====
    $opposite_area = $location === 'STORE' ? 'WAREHOUSE' : 'STORE';

    $dup_sql = "INSERT INTO inventory (
        item_code, brand, category, desc_1, desc_2, desc_3, desc_4,
        retail_price, fixed_price, units,
        thresh_hold, img,
        tsv, is_deleted, date_created, last_updated, location
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)";

    $dup_stmt = $conn->prepare($dup_sql);
    if ($dup_stmt) {
        $zero_units = 0;
        $zero_tsv = 0;
        $dup_stmt->bind_param(
            'sssssssdddisiss',
            $item_code, $brand, $category, $desc_1, $desc_2, $desc_3, $desc_4,
            $retail_price, $fixed_price, $zero_units,
            $thresh_hold, $img,
            $zero_tsv, $is_deleted, $opposite_area
        );
        $dup_stmt->execute();
        $dup_stmt->close();
    }

} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to insert item: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
