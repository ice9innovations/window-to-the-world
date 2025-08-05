<?php
// Animal Farm v2 - Health Check Endpoint

require_once __DIR__ . '/common.php';

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
?>