<?php
// Animal Farm v3 - PHP SQLite Controller
// Replaces Node.js services for GPU-free deployment

// Import common functions (includes automatic camelCase conversion)
require_once __DIR__ . '/common.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}


// SQLite configuration
$sqliteDbPath = '/var/www/db/animal_farm.db';
$userInteractionsDbPath = '/var/www/db/user_interactions.db';












// Store complete user interaction for turing tape reconstruction
function storeUserInteraction($interactionData) {
    $startTime = microtime(true);
    
    $pdo = connectUserInteractions();
    if (!$pdo) {
        error_log("Failed to connect to user interactions database");
        return false;
    }
    
    try {
        // Store the complete interaction data as JSON for perfect reconstruction
        $completeInteractionJson = json_encode($interactionData);
        
        // Extract minimal fields for indexing/querying
        $imageFile = $interactionData['imageFile'] ?? '';
        $userAction = $interactionData['userAction'] ?? '';
        $timestamp = $interactionData['timestamp'] ?? date('c');
        $username = $interactionData['user']['name'] ?? '';
        $sessionId = $interactionData['user']['sessionId'] ?? '';
        $imageIndex = $interactionData['sessionData']['imageIndex'] ?? null;
        
        $stmt = $pdo->prepare('
            INSERT INTO user_interactions (
                image_file, user_action, timestamp, username, session_id, image_index, analysis_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        
        $result = $stmt->execute([
            $imageFile, $userAction, $timestamp, $username, $sessionId, $imageIndex, $completeInteractionJson
        ]);
        
        $queryTime = microtime(true) - $startTime;
        error_log("Complete user interaction stored in " . round($queryTime * 1000, 2) . "ms for {$userAction} on {$imageFile}");
        
        return $result;
        
    } catch (Exception $e) {
        error_log("SQLite user interaction insert error: " . $e->getMessage());
        error_log("Error details: " . print_r($interactionData, true));
        return false;
    }
}

// Route definitions
$routes = [
    'GET' => [
        '/health' => 'handleHealth',
        '/controller.php/health' => 'handleHealth',
        '/retrieve' => 'handleRetrieve',
        '/controller.php/retrieve' => 'handleRetrieve',
        '/preferences' => 'handleGetPreferences',
        '/controller.php/preferences' => 'handleGetPreferences'
    ],
    'POST' => [
        '/store' => 'handleStore',
        '/controller.php/store' => 'handleStore',
        '/preferences' => 'handleStorePreferences',
        '/controller.php/preferences' => 'handleStorePreferences'
    ]
];

// Route handlers
function handleHealth() {
    $health = [
        'status' => 'healthy',
        'timestamp' => date('c'),
        'mode' => 'php_sqlite_mysql',
        'message' => 'PHP API with SQLite analysis data and MySQL user data'
    ];
    
    try {
        // Test SQLite connection
        $sqlite = connectSQLite();
        $health['sqlite_status'] = $sqlite ? 'connected' : 'failed';
        
        // Test MySQL connection  
        $mysql = connectUserInteractions();
        $health['mysql_status'] = $mysql ? 'connected' : 'failed';
        
        // If either database fails, mark as unhealthy
        if (!$sqlite || !$mysql) {
            $health['status'] = 'degraded';
            http_response_code(503);
        }
        
        echo json_encode($health);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'timestamp' => date('c'),
            'error' => $e->getMessage()
        ]);
    }
}


function handleRetrieve() {
    $sessionId = $_GET['session_id'] ?? null;
    $username = $_GET['username'] ?? null;
    
    if (!$sessionId && !$username) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required parameter: session_id or username'
        ]);
        return;
    }
    
    try {
        $pdo = connectUserInteractions();
        if (!$pdo) {
            throw new Exception('Failed to connect to user interactions database');
        }
        
        // Build query based on available parameters
        if ($sessionId) {
            $stmt = $pdo->prepare('SELECT * FROM user_interactions WHERE session_id = ? ORDER BY timestamp ASC');
            $stmt->execute([$sessionId]);
        } else {
            $stmt = $pdo->prepare('SELECT * FROM user_interactions WHERE username = ? ORDER BY timestamp ASC');
            $stmt->execute([$username]);
        }
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Reconstruct complete interaction data from analysis_data JSON
        $interactions = [];
        foreach ($rows as $row) {
            if ($row['analysis_data']) {
                $completeData = json_decode($row['analysis_data'], true);
                if ($completeData) {
                    $interactions[] = $completeData;
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'sessionId' => $sessionId,
            'username' => $username,
            'interactionCount' => count($interactions),
            'interactions' => $interactions
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Retrieval failed',
            'details' => $e->getMessage()
        ]);
    }
}

function handleStore() {
    $input = file_get_contents('php://input');
    $interactionData = json_decode($input, true);
    
    if (!$interactionData) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON data'
        ]);
        return;
    }
    
    try {
        $success = storeUserInteraction($interactionData);
        
        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Interaction stored successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to store interaction'
            ]);
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Storage failed',
            'details' => $e->getMessage()
        ]);
    }
}

// Store user preferences for session restoration
function handleStorePreferences() {
    $rawInput = file_get_contents('php://input');
    $preferencesData = json_decode($rawInput, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid JSON data'
        ]);
        return;
    }
    
    $username = $preferencesData['username'] ?? null;
    $preferences = $preferencesData['preferences'] ?? null;
    
    if (!$username || !$preferences) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields: username, preferences'
        ]);
        return;
    }
    
    try {
        $pdo = connectUserInteractions();
        if (!$pdo) {
            throw new Exception('Failed to connect to user interactions database');
        }
        
        $stmt = $pdo->prepare('
            INSERT OR REPLACE INTO user_preferences (username, preferences, updated_at)
            VALUES (?, ?, ?)
        ');
        
        $result = $stmt->execute([
            $username,
            json_encode($preferences),
            date('c')
        ]);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'message' => 'User preferences stored successfully'
            ]);
        } else {
            throw new Exception('Failed to store preferences');
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Storage failed',
            'details' => $e->getMessage()
        ]);
    }
}

// Retrieve user preferences for session restoration
function handleGetPreferences() {
    $username = $_GET['username'] ?? null;
    
    if (!$username) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required parameter: username'
        ]);
        return;
    }
    
    try {
        $pdo = connectUserInteractions();
        if (!$pdo) {
            throw new Exception('Failed to connect to user interactions database');
        }
        
        $stmt = $pdo->prepare('SELECT preferences, updated_at FROM user_preferences WHERE username = ?');
        $stmt->execute([$username]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo json_encode([
                'success' => true,
                'preferences' => json_decode($result['preferences'], true),
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

function handleNotFound() {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Endpoint not found',
        'available_endpoints' => [
            '/health' => 'Health check',
            '/store' => 'Store user interaction (POST)',
            '/retrieve?session_id=<id>' => 'Retrieve user interactions by session',
            '/retrieve?username=<name>' => 'Retrieve user interactions by username',
            '/preferences?username=<name>' => 'Retrieve user preferences (GET)',
            '/preferences' => 'Store user preferences (POST)'
        ]
    ]);
}

// Router
$requestUri = $_SERVER['REQUEST_URI'];
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove /v3/ prefix if present
$path = preg_replace('#^/v3/#', '/', $path);

// Route the request
if (isset($routes[$method][$path])) {
    $handler = $routes[$method][$path];
    $handler();
} else {
    handleNotFound();
}

?>
