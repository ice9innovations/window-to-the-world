<?php
// Animal Farm v2 - Preferences Endpoint

require_once __DIR__ . '/common.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Store preferences
    $rawInput = file_get_contents('php://input');
    $preferencesData = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON data'
        ]);
        exit();
    }
    
    $username = $preferencesData['username'] ?? null;
    $preferences = $preferencesData['preferences'] ?? null;
    
    if (!$username || !$preferences) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields: username, preferences'
        ]);
        exit();
    }
    
    try {
        $pdo = connectUserInteractions();
        if (!$pdo) {
            throw new Exception('Failed to connect to user interactions database');
        }
        
        $preferencesJson = json_encode($preferences);
        
        $stmt = $pdo->prepare('
            INSERT INTO user_sessions (user_id, session_data) 
            VALUES (?, ?)
        ');
        
        $result = $stmt->execute([$username, $preferencesJson]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'Preferences saved successfully'
            ]);
        } else {
            throw new Exception('Failed to save preferences');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Storage failed',
            'details' => $e->getMessage()
        ]);
    }
    
} else {
    // Get preferences
    $username = $_GET['username'] ?? null;
    
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
        
        $stmt = $pdo->prepare('SELECT session_data, updated_at FROM user_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1');
        $stmt->execute([$username]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'preferences' => json_decode($result['session_data'], true),
                'updatedAt' => $result['updated_at']
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'preferences' => null,
                'message' => 'No preferences found for user'
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Retrieval failed',
            'details' => $e->getMessage()
        ]);
    }
}
?>