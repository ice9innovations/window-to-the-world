<?php
// Animal Farm v2 - Reset Consumed Flags Endpoint
// Resets consumed flags for session recovery

require_once __DIR__ . '/common.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? null;

if (!$username) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required parameter: username'
    ]);
    exit();
}

try {
    $pdo = connectUserInteractions();
    if (!$pdo) {
        throw new Exception('Failed to connect to user interactions database');
    }
    
    // Reset all consumed flags for this user
    $stmt = $pdo->prepare('UPDATE user_images SET consumed = 0 WHERE user_id = ? AND consumed = 1');
    $stmt->execute([$username]);
    
    $resetCount = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'username' => $username,
        'resetCount' => $resetCount,
        'message' => "Reset $resetCount consumed flags for session recovery"
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to reset consumed flags',
        'details' => $e->getMessage()
    ]);
}
?>