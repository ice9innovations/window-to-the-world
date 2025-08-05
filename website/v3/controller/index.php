<?php
// Animal Farm v2 - Controller API Info
// Handles /v2/controller/ requests

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'success' => true,
    'message' => 'Animal Farm v2 API',
    'version' => 'php_sqlite',
    'timestamp' => date('c'),
    'available_endpoints' => [
        '/health' => 'Health check',
        '/image?url=<image_url>' => 'Get specific image data',
        '/image?random=true' => 'Get random image data',
        '/store' => 'Store user interaction (POST)',
        '/retrieve?session_id=<id>' => 'Retrieve user interactions by session',
        '/retrieve?username=<name>' => 'Retrieve user interactions by username',
        '/session_state?username=<name>' => 'Retrieve user session state (GET)',
        '/session_state' => 'Store user session state (POST)'
    ]
]);
?>