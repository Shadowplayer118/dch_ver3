<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include '../db.php';

function getParam($conn, $key) {
    return isset($_GET[$key]) ? trim($conn->real_escape_string($_GET[$key])) : '';
}

$search = getParam($conn, 'search');
$brand = getParam($conn, 'brand');
$category = getParam($conn, 'category');
$desc1 = getParam($conn, 'desc_1');
$desc4 = getParam($conn, 'desc_4');
$area = getParam($conn, 'area');

$whereParts = ["is_deleted = 0"];

if ($search !== '') {
    $whereParts[] = "(item_code LIKE '%$search%' 
        OR desc_1 LIKE '%$search%' 
        OR desc_2 LIKE '%$search%' 
        OR desc_3 LIKE '%$search%' 
        OR CONCAT(desc_1, ' ', desc_2, ' ', desc_3) LIKE '%$search%')";
}

if ($brand !== '') $whereParts[] = "brand = '$brand'";
if ($category !== '') $whereParts[] = "category = '$category'";
if ($desc1 !== '') $whereParts[] = "desc_1 = '$desc1'";
if ($desc4 !== '') $whereParts[] = "desc_4 = '$desc4'";
if ($area !== '') $whereParts[] = "area = '$area'";

$baseWhere = count($whereParts) ? "WHERE " . implode(" AND ", $whereParts) : '';

$filters = [];

// Pull distinct values for brand, category, desc_1, desc_4
foreach (['brand', 'category', 'desc_1', 'desc_4'] as $col) {
    $query = "SELECT DISTINCT `$col` FROM inventory $baseWhere AND `$col` IS NOT NULL AND `$col` <> '' ORDER BY `$col` ASC";
    $result = $conn->query($query);
    $values = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $values[] = $row[$col];
        }
    }
    $filters[$col] = $values;
}

// Area: merge wh_area and store_area
$areaValues = [];

foreach (['area'] as $col) {
    $query = "SELECT DISTINCT `$col` FROM inventory $baseWhere AND `$col` IS NOT NULL AND `$col` <> '' ORDER BY `$col` ASC";
    $result = $conn->query($query);
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $val = $row[$col];
            if ($val !== null && $val !== '') {
                $areaValues[] = $val;
            }
        }
    }
}
$filters['area'] = array_values(array_unique($areaValues));

echo json_encode($filters);
$conn->close();
