<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../db.php");
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/../../vendor/autoload.php';

// Fetch low-stock items
$query = "
    SELECT item_code, desc_1, desc_2, desc_3, desc_4, category, brand, units, location, thresh_hold
    FROM inventory
    WHERE units <= thresh_hold
";
$stmt = $conn->prepare($query);
$stmt->execute();
$result = $stmt->get_result();

$lowStockItems = [];
while ($row = $result->fetch_assoc()) {
    $lowStockItems[] = $row;
}

if (count($lowStockItems) === 0) {
    echo json_encode(['status' => 'success', 'message' => 'No low stock items.']);
    exit;
}

// Initialize PHPMailer
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'crmchs.malinao.dhaniel@gmail.com'; // Your Gmail
    $mail->Password = 'bsxy vcnj lmys pydj'; // App password
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('crmchs.malinao.dhaniel@gmail.com', 'Inventory Monitor');
    $mail->addAddress('dhanielmalinao@gmail.com');

    $mail->isHTML(true);
    $mail->Subject = '📦 Low Stock Alert: Inventory Threshold Reached';

    $body = "
    <html><body>
    <h2>⚠️ The following items have reached or dropped below their stock threshold:</h2>
    <table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;'>
        <thead style='background-color: #f2f2f2;'>
            <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Units Left</th>
                <th>Threshold</th>
                <th>Location</th>
            </tr>
        </thead>
        <tbody>";

    foreach ($lowStockItems as $item) {
        $description = "{$item['desc_1']} {$item['desc_2']} {$item['desc_3']} {$item['desc_4']}";
        $body .= "<tr>
            <td>{$item['item_code']}</td>
            <td>{$description}</td>
            <td>{$item['category']}</td>
            <td>{$item['brand']}</td>
            <td>{$item['units']}</td>
            <td>{$item['thresh_hold']}</td>
            <td>{$item['location']}</td>
        </tr>";
    }

    $body .= "
        </tbody>
    </table>
    <p>Please restock as necessary to avoid shortages.</p>
    </body></html>";

    $mail->Body = $body;
    $mail->AltBody = "Low stock alert:\n\n";

    foreach ($lowStockItems as $item) {
        $desc = "{$item['desc_1']} {$item['desc_2']} {$item['desc_3']} {$item['desc_4']}";
        $mail->AltBody .= "- {$item['item_code']}: $desc, {$item['brand']}, {$item['category']}, Units: {$item['units']}, Threshold: {$item['thresh_hold']}, Location: {$item['location']}\n";
    }

    $mail->send();
    echo json_encode(['status' => 'success', 'message' => 'Low stock email sent to dhanielmalinao@gmail.com.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => "Email failed: {$mail->ErrorInfo}"]);
}
