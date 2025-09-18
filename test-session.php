<?php
// Test script to verify session handling
session_start();

// Set CORS headers
header("Access-Control-Allow-Origin: https://arkanaltafawuq.com");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// For preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check login endpoint
if (strpos($_SERVER['REQUEST_URI'], '/test-login') !== false) {
    // Simulate successful login
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'testuser';
    $_SESSION['role'] = 'admin';
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'session_id' => session_id(),
        'session_data' => $_SESSION
    ]);
    exit();
}

// Check session endpoint
if (strpos($_SERVER['REQUEST_URI'], '/check-session') !== false) {
    echo json_encode([
        'success' => isset($_SESSION['user_id']),
        'session_id' => session_id(),
        'session_data' => $_SESSION
    ]);
    exit();
}

echo json_encode([
    'success' => false,
    'message' => 'Invalid endpoint',
    'request_uri' => $_SERVER['REQUEST_URI']
]);
