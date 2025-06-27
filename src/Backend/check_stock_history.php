<?php
// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

// === DB Connection ===
include '../db.php';

// === Entry Count Check ===
$totalResult = $conn->query("SELECT COUNT(*) AS total FROM stock_history");
$total = 0;
if ($totalResult && ($row = $totalResult->fetch_assoc()) && isset($row['total'])) {
    $total = intval($row['total']);
}

if ($total < 6000) {
    echo json_encode(['success' => false, 'message' => 'Entry count below 6000. No action taken.']);
    exit;
}

// === Fetch oldest 1000 entries by trans_date ===
$oldestData = [];
$transDates = [];

$oldestResult = $conn->query("SELECT * FROM stock_history ORDER BY trans_date ASC LIMIT 1000");
while ($row = $oldestResult->fetch_assoc()) {
    $oldestData[] = $row;
    $transDates[] = $row['trans_date'];
}

if (count($oldestData) === 0) {
    echo json_encode(['success' => false, 'message' => 'No records to export.']);
    exit;
}

// === Get start and end date from trans_date range ===
sort($transDates);
$startDate = date('Y-m-d', strtotime($transDates[0]));
$endDate   = date('Y-m-d', strtotime(end($transDates)));

// === Folder setup on Desktop ===
$folderName = $startDate . '_to_' . $endDate;
$userDesktop = getenv("USERPROFILE") . "\\Desktop\\stock_histories\\$folderName";
if (!is_dir($userDesktop)) {
    if (!mkdir($userDesktop, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create folder on Desktop.']);
        exit;
    }
}

// === Get the stock_ids to use for mysqldump and deletion ===
$stockIds = array_column($oldestData, 'stock_id');
$stockIdList = implode(',', $stockIds);

// === Export to .sql using mysqldump ===
$mysqldumpPath = 'D:\\Downloads\\Xamp_Folder\\mysql\\bin\\mysqldump.exe';
$oldestSQLFile = $userDesktop . "\\oldest_1000.sql";

if (!file_exists($mysqldumpPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'mysqldump.exe not found.']);
    exit;
}

exec("\"$mysqldumpPath\" -u root dch stock_history --where=\"stock_id IN ($stockIdList)\" > \"$oldestSQLFile\"");

// === Export to CSV manually ===
$csvFile = $userDesktop . "\\oldest_1000.csv";
$csvHandle = fopen($csvFile, 'w');

if (count($oldestData) > 0) {
    fputcsv($csvHandle, array_keys($oldestData[0]));
    foreach ($oldestData as $row) {
        fputcsv($csvHandle, $row);
    }
}
fclose($csvHandle);

// === Delete the exported entries based on stock_id list ===
$deleteQuery = "
    DELETE FROM stock_history
    WHERE stock_id IN (" . implode(',', array_map('intval', $stockIds)) . ")
";
$conn->query($deleteQuery);

// === Response ===
echo json_encode([
    'success' => true,
    'message' => "Oldest 1000 based on trans_date exported to SQL and CSV. Deleted from DB.",
    'folder' => $userDesktop
]);

$conn->close();
