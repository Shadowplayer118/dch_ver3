<?php
// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database credentials
$dbHost = 'localhost';
$dbUser = 'root';
$dbPass = '';
$dbName = 'dch';

// Folder to save backups (must be writable)
$backupFolder = __DIR__ . '/Backups';

// Ensure the backup folder exists
if (!file_exists($backupFolder)) {
    if (!mkdir($backupFolder, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create backup folder.']);
        exit;
    }
}

// Check if the folder is writable
if (!is_writable($backupFolder)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Backup folder is not writable.']);
    exit;
}

// Generate a timestamped backup file name
$backupFile = $backupFolder . '/backup_' . date('Y-m-d_H-i-s') . '.sql';

// Escape values to avoid issues
$dbUser = escapeshellarg($dbUser);
$dbPass = escapeshellarg($dbPass);
$dbHost = escapeshellarg($dbHost);
$dbName = escapeshellarg($dbName);

// mysqldump command (adjust path if needed)
$command = "mysqldump --user=$dbUser --password=$dbPass --host=$dbHost $dbName > " . escapeshellarg($backupFile);

// Execute the command
exec($command, $output, $returnVar);

// Respond with JSON
header('Content-Type: application/json');
if ($returnVar === 0) {
    echo json_encode([
        'success' => true,
        'message' => 'Backup created successfully!',
        'file' => basename($backupFile)
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Backup failed! Please check if mysqldump is installed and accessible.'
    ]);
}
