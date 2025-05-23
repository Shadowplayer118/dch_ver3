<?php
// Database configuration
$host = 'localhost';       // usually 'localhost'
$dbname = 'dch'; // change this to your DB name
$user = 'root';   // your DB username
$pass = '';   // your DB password

// Create connection
$conn = new mysqli($host, $user, $pass, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Connection failed: " . $conn->connect_error
    ]));
}
?>
