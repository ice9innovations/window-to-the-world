<?php
// Animal Farm v2 - Common functions for all endpoints

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Validate request source and set appropriate CORS header
function validateRequestSource() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // No origin header = same-origin request (allow)
    if (empty($origin)) {
        return true;
    }
    
    // Cross-origin request - check against allowed origins
    $allowedOrigins = explode(',', $_ENV['ALLOWED_ORIGINS'] ?? '');
    $allowedOrigins = array_map('trim', $allowedOrigins);
    
    if (empty($allowedOrigins[0])) {
        // No origins configured - fail secure for cross-origin
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'No allowed origins configured']);
        exit();
    }
    
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: $origin");
        return true;
    }
    
    // Unauthorized cross-origin request
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden', 'details' => 'Request source not authorized']);
    exit();
}

// Handle preflight OPTIONS requests (only when running in web context)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// AUTOMATIC CAMELCASE OUTPUT FILTER
// Start output buffering to catch all JSON responses
ob_start();

// Register shutdown function to automatically convert ALL JSON to camelCase
register_shutdown_function(function() {
    $output = ob_get_contents();
    ob_end_clean();
    
    // Only process if it looks like JSON and we're in a web context
    if ($output && isset($_SERVER['REQUEST_METHOD'])) {
        $trimmed = trim($output);
        if (($trimmed[0] === '{' || $trimmed[0] === '[') && !empty($trimmed)) {
            $decoded = json_decode($output, true);
            if ($decoded !== null && json_last_error() === JSON_ERROR_NONE) {
                // Convert to camelCase and output - this happens automatically for ALL responses
                echo json_encode(toCamelCase($decoded));
                return;
            }
        }
    }
    
    // If not JSON or couldn't decode, output as-is
    echo $output;
});

// Load environment variables
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Call validation for all requests except OPTIONS preflight - AFTER env loading
if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    validateRequestSource();
}

// Database configuration
$sqliteDbPath = '/var/www/db/animal_farm.db';
$userInteractionsDbPath = '/var/www/db/user_interactions.db';

// CamelCase conversion function
function toCamelCase($input) {
    if (is_array($input)) {
        $result = [];
        foreach ($input as $key => $value) {
            $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result[$camelKey] = toCamelCase($value);
        }
        return $result;
    } elseif (is_object($input)) {
        $result = new stdClass();
        foreach ($input as $key => $value) {
            $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result->$camelKey = toCamelCase($value);
        }
        return $result;
    } else {
        return $input;
    }
}

// Database connections
function connectSQLite($reset = false) {
    global $sqliteDbPath;
    
    static $connection = null;
    if ($reset) {
        $connection = null;
    }
    if ($connection !== null) {
        return $connection;
    }
    
    try {
        if (!file_exists($sqliteDbPath)) {
            throw new Exception("SQLite database not found: $sqliteDbPath");
        }
        
        $connection = new PDO("sqlite:$sqliteDbPath");
        $connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        return $connection;
    } catch (Exception $e) {
        error_log("SQLite connection error: " . $e->getMessage());
        return null;
    }
}

function connectUserInteractions() {
    static $connection = null;
    if ($connection !== null) {
        return $connection;
    }
    
    try {
        // Load environment variables from .env file
        $env_file = __DIR__ . '/.env';
        if (file_exists($env_file)) {
            $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                if (!array_key_exists($name, $_ENV)) {
                    $_ENV[$name] = $value;
                }
            }
        }
        
        $mysql_host = $_ENV['MYSQL_HOST'] ?? getenv('MYSQL_HOST');
        $mysql_database = $_ENV['MYSQL_DATABASE'] ?? getenv('MYSQL_DATABASE');
        $mysql_username = $_ENV['MYSQL_USERNAME'] ?? getenv('MYSQL_USERNAME');
        $mysql_password = $_ENV['MYSQL_PASSWORD'] ?? getenv('MYSQL_PASSWORD');
        
        if (!$mysql_host || !$mysql_database || !$mysql_username || !$mysql_password) {
            throw new Exception("Missing MySQL environment variables. Check .env configuration.");
        }
        
        $dsn = "mysql:host={$mysql_host};dbname={$mysql_database};charset=utf8mb4";
        $connection = new PDO($dsn, $mysql_username, $mysql_password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]);
        
        return $connection;
    } catch (Exception $e) {
        error_log("MySQL connection error: " . $e->getMessage());
        return null;
    }
}


?>