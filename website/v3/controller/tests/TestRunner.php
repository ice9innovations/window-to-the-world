<?php
/**
 * Test Runner
 * 
 * Runs all test suites and provides comprehensive reporting.
 * This ensures all tests are executed consistently.
 */

require_once __DIR__ . '/CamelCaseConversionTest.php';
require_once __DIR__ . '/DatabaseConnectionTest.php';
require_once __DIR__ . '/UtilityFunctionsTest.php';
require_once __DIR__ . '/EndpointIntegrationTest.php';

class TestRunner {
    private $totalPassed = 0;
    private $totalFailed = 0;
    private $startTime;
    
    public function runAllTests($baseUrl = 'http://localhost/v2/controller') {
        $this->startTime = microtime(true);
        
        echo "🚀 Animal Farm v2 Test Suite\n";
        echo "================================\n";
        echo "Started at: " . date('Y-m-d H:i:s') . "\n\n";
        
        $results = [];
        
        // Run each test suite
        $results['camelcase'] = $this->runTestSuite('CamelCase Conversion', function() {
            $tester = new CamelCaseConversionTest();
            return $tester->runAllTests();
        });
        
        $results['database'] = $this->runTestSuite('Database Connections', function() {
            $tester = new DatabaseConnectionTest();
            return $tester->runAllTests();
        });
        
        $results['utilities'] = $this->runTestSuite('Utility Functions', function() {
            $tester = new UtilityFunctionsTest();
            return $tester->runAllTests();
        });
        
        $results['endpoints'] = $this->runTestSuite('Endpoint Integration', function() use ($baseUrl) {
            $tester = new EndpointIntegrationTest($baseUrl);
            return $tester->runAllTests();
        });
        
        $this->displaySummary($results);
        
        return array_reduce($results, function($carry, $result) {
            return $carry && $result;
        }, true);
    }
    
    private function runTestSuite($suiteName, $testFunction) {
        echo "📋 {$suiteName} Tests\n";
        echo str_repeat('-', strlen($suiteName) + 7) . "\n";
        
        $startTime = microtime(true);
        
        try {
            $result = $testFunction();
            $duration = microtime(true) - $startTime;
            
            echo "⏱️  Duration: " . number_format($duration, 3) . "s\n\n";
            
            return $result;
            
        } catch (Exception $e) {
            echo "💥 Test suite failed with exception: " . $e->getMessage() . "\n\n";
            return false;
        }
    }
    
    private function displaySummary($results) {
        $totalDuration = microtime(true) - $this->startTime;
        
        echo "🏁 Test Suite Summary\n";
        echo "====================\n";
        echo "Total Duration: " . number_format($totalDuration, 3) . "s\n\n";
        
        $passedSuites = 0;
        $totalSuites = count($results);
        
        foreach ($results as $suiteName => $passed) {
            $status = $passed ? '✅ PASS' : '❌ FAIL';
            $displayName = ucwords(str_replace('_', ' ', $suiteName));
            echo "{$status} {$displayName}\n";
            
            if ($passed) {
                $passedSuites++;
            }
        }
        
        echo "\n";
        
        if ($passedSuites === $totalSuites) {
            echo "🎉 All test suites passed! ({$passedSuites}/{$totalSuites})\n";
        } else {
            echo "⚠️  {$passedSuites}/{$totalSuites} test suites passed\n";
        }
        
        // Environment info
        echo "\n📊 Environment Information:\n";
        echo "PHP Version: " . phpversion() . "\n";
        echo "OS: " . php_uname('s') . " " . php_uname('r') . "\n";
        echo "Memory Usage: " . number_format(memory_get_peak_usage(true) / 1024 / 1024, 2) . " MB\n";
        
        // Extension checks
        $requiredExtensions = ['pdo', 'pdo_sqlite', 'json', 'curl'];
        $missingExtensions = [];
        
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $missingExtensions[] = $ext;
            }
        }
        
        if (empty($missingExtensions)) {
            echo "✅ All required PHP extensions available\n";
        } else {
            echo "⚠️  Missing PHP extensions: " . implode(', ', $missingExtensions) . "\n";
        }
        
        echo "\nCompleted at: " . date('Y-m-d H:i:s') . "\n";
    }
}

// Run tests if this file is executed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $baseUrl = $argv[1] ?? 'http://localhost/v2/controller';
    
    echo "Usage: php TestRunner.php [base_url]\n";
    echo "Example: php TestRunner.php http://192.168.0.101/v2/controller\n\n";
    
    $runner = new TestRunner();
    $success = $runner->runAllTests($baseUrl);
    exit($success ? 0 : 1);
}
?>