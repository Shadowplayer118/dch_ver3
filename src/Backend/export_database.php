<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Set Philippine timezone
date_default_timezone_set('Asia/Manila');

$host = 'localhost';
$username = 'root';
$password = ''; // Leave blank if no password
$database = 'dch';

// Set filename with PH time
$filename = "backup_" . date("Y-m-d_H-i-s") . ".sql";

// Create 'Backups' directory relative to this script
$backupDir = __DIR__ . DIRECTORY_SEPARATOR . 'Backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

// Full path to the backup file
$backupFilePath = $backupDir . DIRECTORY_SEPARATOR . $filename;

// Path to mysqldump (adjust this to your actual path)
$mysqldumpPath = 'D:\\Downloads\\Xamp_Folder\\mysql\\bin\\mysqldump.exe';

// Escape everything properly and run the command in the right working directory
if ($password === '') {
    $command = "cmd /c \"cd /d D:\\Downloads\\Xamp_Folder\\mysql\\bin && mysqldump --user={$username} --host={$host} {$database} > \"{$backupFilePath}\"\"";
} else {
    $command = "cmd /c \"cd /d D:\\Downloads\\Xamp_Folder\\mysql\\bin && mysqldump --user={$username} --password={$password} --host={$host} {$database} > \"{$backupFilePath}\"\"";
}

// Execute the command
$output = shell_exec($command);

// Check if dump file was created
if (file_exists($backupFilePath) && filesize($backupFilePath) > 0) {
    header('Content-Description: File Transfer');
    header('Content-Type: application/sql');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($backupFilePath));
    readfile($backupFilePath);
    // Optional: unlink($backupFilePath); // Delete after download
    exit;
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database export failed.',
        'command' => $command,
        'debug' => $output,
        'file_exists' => file_exists($backupFilePath),
        'file_size' => file_exists($backupFilePath) ? filesize($backupFilePath) : 0
    ]);
}
