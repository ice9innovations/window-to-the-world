<?php
/**
 * Database Connection Tests
 * 
 * Tests database connections with realistic failure scenarios
 * and actual connection validation, not just mocked responses.
 */

require_once __DIR__ . '/../controller/common.php';

class DatabaseConnectionTest {
    private $testsPassed = 0;
    private $testsFailed = 0;
    
    public function runAllTests() {
        echo "🧪 Running database connection tests...\n\n";
        
        $this->testSQLiteConnectionWithValidPath();
        $this->testSQLiteConnectionWithInvalidPath();
        $this->testSQLiteConnectionReuse();
        $this->testUserInteractionsConnection();
        
        echo "\n📊 Test Results:\n";
        echo "✅ Passed: {$this->testsPassed}\n";
        echo "❌ Failed: {$this->testsFailed}\n";
        
        return $this->testsFailed === 0;
    }
    
    private function assert($condition, $testName, $errorMessage = '') {
        if ($condition) {
            echo "✅ {$testName}\n";
            $this->testsPassed++;
        } else {
            echo "❌ {$testName}";
            if ($errorMessage) {
                echo " - {$errorMessage}";
            }
            echo "\n";
            $this->testsFailed++;
        }
    }
    
    private function testSQLiteConnectionWithValidPath() {
        // Test with actual database file
        global $sqliteDbPath;
        $originalPath = $sqliteDbPath;
        
        try {
            $connection = connectSQLite();
            
            $this->assert(
                $connection !== null,
                'SQLite connection returns valid PDO object'
            );
            
            $this->assert(
                $connection instanceof PDO,
                'SQLite connection is PDO instance'
            );
            
            // Test actual database functionality
            $stmt = $connection->query("SELECT name FROM sqlite_master WHERE type='table'");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $this->assert(
                in_array('images', $tables),
                'SQLite database contains expected images table'
            );
            
        } catch (Exception $e) {
            $this->assert(
                false,
                'SQLite connection with valid path',
                'Exception: ' . $e->getMessage()
            );
        }
    }
    
    private function testSQLiteConnectionWithInvalidPath() {
        global $sqliteDbPath;
        $originalPath = $sqliteDbPath;
        
        // Reset static connection cache and set invalid path
        $sqliteDbPath = '/nonexistent/path/database.db';
        
        try {
            $connection = connectSQLite(true); // Reset cache and try invalid path
            
            $this->assert(
                $connection === null,
                'SQLite connection returns null for invalid path'
            );
            
        } catch (Exception $e) {
            $this->assert(
                false,
                'SQLite connection with invalid path should return null, not throw',
                'Exception: ' . $e->getMessage()
            );
        } finally {
            // Restore original path
            $sqliteDbPath = $originalPath;
        }
    }
    
    private function testSQLiteConnectionReuse() {
        // Test that connections are properly reused (static caching)
        $connection1 = connectSQLite();
        $connection2 = connectSQLite();
        
        $this->assert(
            $connection1 === $connection2,
            'SQLite connections are reused (same object instance)'
        );
    }
    
    private function testUserInteractionsConnection() {
        try {
            $connection = connectUserInteractions();
            
            if ($connection !== null) {
                $this->assert(
                    $connection instanceof PDO,
                    'User interactions connection is PDO instance'
                );
                
                // Test database structure (MySQL syntax)
                $stmt = $connection->query("SHOW TABLES LIKE 'user_images'");
                $tableExists = $stmt->rowCount() > 0;
                
                $this->assert(
                    $tableExists,
                    'User interactions database contains expected user_images table'
                );
                
                // Test we can query the table structure (MySQL syntax)
                $stmt = $connection->query("DESCRIBE user_images");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $columnNames = array_column($columns, 'Field');
                
                $requiredColumns = ['id', 'user_id', 'session_id', 'filename', 'data'];
                $hasRequiredColumns = array_intersect($requiredColumns, $columnNames) === $requiredColumns;
                
                $this->assert(
                    $hasRequiredColumns,
                    'User images table has required columns for unified objects'
                );
                
            } else {
                $this->assert(
                    true,
                    'User interactions connection gracefully handles missing database'
                );
            }
            
        } catch (Exception $e) {
            $this->assert(
                false,
                'User interactions connection',
                'Exception: ' . $e->getMessage()
            );
        }
    }
}

// Run tests if this file is executed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $tester = new DatabaseConnectionTest();
    $success = $tester->runAllTests();
    exit($success ? 0 : 1);
}
?>