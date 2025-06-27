<?php
// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

// Set timezone
date_default_timezone_set('Asia/Manila');

// ======= 🖥️ Set folder to Desktop =======
$userDesktop = getenv("USERPROFILE") . "\\Desktop\\DCH_Backups";
$backupFolder = $userDesktop;

// Create folder if not exist
if (!is_dir($backupFolder)) {
    if (!mkdir($backupFolder, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create backup folder on Desktop.']);
        exit;
    }
}

// Check writable
if (!is_writable($backupFolder)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Backup folder is not writable.']);
    exit;
}

include '../db.php';

// Backup filename
$backupFile = $backupFolder . '\\backup_' . date('Y-m-d_H-i-s') . '.sql';

// Full path to mysqldump
$mysqldumpPath = 'D:\\Downloads\\Xamp_Folder\\mysql\\bin\\mysqldump.exe';

if (!file_exists($mysqldumpPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'mysqldump.exe not found at specified path.']);
    exit;
}

// Escape and build command
$escapedUser = escapeshellarg($user);
$escapedPass = escapeshellarg($pass);
$escapedHost = escapeshellarg($host);
$escapedDb   = escapeshellarg($dbname);
$escapedFile = escapeshellarg($backupFile);

$command = "\"$mysqldumpPath\" --user=$escapedUser --password=$escapedPass --host=$escapedHost $escapedDb > $escapedFile 2>&1";

// Execute
exec($command, $output, $returnVar);

// Response
if ($returnVar === 0) {
    echo json_encode([
        'success' => true,
        'message' => 'Backup saved to Desktop!',
        'file' => $backupFile
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Backup failed. Check mysqldump path or DB credentials.',
        'command' => $command,
        'output' => $output
    ]);
}
