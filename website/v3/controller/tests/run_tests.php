<?php
/**
 * Simple test runner for Animal Farm v2
 * 
 * Usage: php tests/run_tests.php
 */

echo "Animal Farm v2 Test Suite\n";
echo str_repeat("=", 30) . "\n\n";

// List of test files to run
$testFiles = [
    'CamelCaseConversionTest.php',
    'EndpointIntegrationTest.php',
    'SoftDeleteConsumePatternTest.php'
];

$totalTests = 0;
$totalPassed = 0;
$totalFailed = 0;

foreach ($testFiles as $testFile) {
    $testPath = __DIR__ . '/' . $testFile;
    
    if (!file_exists($testPath)) {
        echo "❌ Test file not found: $testFile\n";
        continue;
    }
    
    echo "Running $testFile...\n";
    echo str_repeat("-", strlen($testFile) + 11) . "\n";
    
    // Capture output
    ob_start();
    require_once $testPath;
    $output = ob_get_clean();
    
    // Parse results (simple parsing for our custom test format)
    if (preg_match('/Total: (\d+) tests/', $output, $matches)) {
        $tests = (int)$matches[1];
        $totalTests += $tests;
    }
    
    if (preg_match('/Passed: (\d+)/', $output, $matches)) {
        $passed = (int)$matches[1];
        $totalPassed += $passed;
    }
    
    if (preg_match('/Failed: (\d+)/', $output, $matches)) {
        $failed = (int)$matches[1];
        $totalFailed += $failed;
    }
    
    // Show the output
    echo $output . "\n";
}

echo str_repeat("=", 50) . "\n";
echo "OVERALL TEST SUMMARY\n";
echo str_repeat("=", 50) . "\n";
echo "Total Test Files: " . count($testFiles) . "\n";
echo "Total Tests: $totalTests\n";  
echo "Total Passed: $totalPassed\n";
echo "Total Failed: $totalFailed\n";

if ($totalFailed === 0) {
    echo "\n🎉 ALL TESTS PASSED! Ready for production! 🎉\n";
    exit(0);
} else {
    echo "\n⚠️  SOME TESTS FAILED - Fix before deploying! ⚠️\n";
    exit(1);
}
?>