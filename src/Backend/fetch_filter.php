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

// Read active filters from query params
function getParam($conn, $key) {
    return isset($_GET[$key]) ? trim($conn->real_escape_string($_GET[$key])) : '';
}

$search = getParam($conn, 'search');
$brand = getParam($conn, 'brand');
$category = getParam($conn, 'category');
$desc1 = getParam($conn, 'desc_1');
$desc4 = getParam($conn, 'desc_4');
$area = getParam($conn, 'area');

// Prepare filters
$allFilters = [
    'brand' => $brand,
    'category' => $category,
    'desc_1' => $desc1,
    'desc_4' => $desc4,
    'area' => $area
];

$filters = [];
$columns = ['brand', 'category', 'desc_1', 'desc_4', 'wh_area', 'store_area'];

foreach ($columns as $col) {
    $colFilter = [];

    // Build conditions based on other filters (exclude current column)
    if ($search !== '') {
        $colFilter[] = "(item_code LIKE '%$search%' 
                        OR desc_1 LIKE '%$search%' 
                        OR desc_2 LIKE '%$search%' 
                        OR desc_3 LIKE '%$search%' 
                        OR CONCAT(desc_1, ' ', desc_2, ' ', desc_3) LIKE '%$search%')";
    }

    foreach ($allFilters as $key => $value) {
        if ($value === '') continue;

        if ($key === 'area' && $col !== 'wh_area' && $col !== 'store_area') {
            $colFilter[] = "(wh_area = '$value' OR store_area = '$value')";
        } elseif ($key !== $col) {
            $colFilter[] = "$key = '$value'";
        }
    }

    $extraCondition = count($colFilter) ? "WHERE " . implode(" AND ", $colFilter) . " AND `$col` IS NOT NULL AND `$col` <> ''"
                                        : "WHERE `$col` IS NOT NULL AND `$col` <> ''";

    $query = "SELECT DISTINCT `$col` FROM inventory $extraCondition ORDER BY `$col` ASC";
    $result = $conn->query($query);

    $values = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $values[] = $row[$col];
        }
    }

    // Combine `wh_area` and `store_area` into `area`
    if ($col === 'wh_area' || $col === 'store_area') {
        $filters['area'] = array_values(array_unique(array_merge($filters['area'] ?? [], $values)));
    } else {
        $filters[$col] = $values;
    }
}

// Guarantee area is always an array
if (!isset($filters['area'])) {
    $filters['area'] = [];
}

echo json_encode($filters);
$conn->close();
