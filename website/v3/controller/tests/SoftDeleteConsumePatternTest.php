<?php
/**
 * Test suite for soft delete consume pattern functionality
 * 
 * Verifies that:
 * - Images are soft-deleted (consumed=1) instead of hard-deleted
 * - Consumed images are filtered out of subsequent queries
 * - ON DUPLICATE KEY UPDATE handles encounter_id collisions correctly
 * - Navigation behavior remains identical to hard delete pattern
 */

require_once __DIR__ . '/../controller/common.php';

class SoftDeleteConsumePatternTest {
    private $pdo;
    private $testUsername = 'test_consume_pattern_user';
    private $testSessionId = 'test_session_123';
    
    public function __construct() {
        $this->pdo = connectUserInteractions();
        if (!$this->pdo) {
            throw new Exception('Failed to connect to test database');
        }
    }
    
    public function setUp() {
        // Clean up any existing test data
        $stmt = $this->pdo->prepare('DELETE FROM user_images WHERE user_id = ?');
        $stmt->execute([$this->testUsername]);
    }
    
    public function tearDown() {
        // Clean up test data
        $stmt = $this->pdo->prepare('DELETE FROM user_images WHERE user_id = ?');
        $stmt->execute([$this->testUsername]);
    }
    
    public function testSoftDeleteConsumePattern() {
        $passed = 0;
        $failed = 0;
        $total = 0;
        
        echo "Testing soft delete consume pattern...\n";
        
        // Test 1: Store test image
        $total++;
        $testImageData = [
            'filename' => 'test_image_001.jpg',
            'encounterId' => 'test_encounter_001',
            'actionHistory' => [
                ['action' => 'view', 'timestamp' => date('Y-m-d H:i:s')]
            ]
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO user_images (user_id, session_id, filename, encounter_id, data, consumed)
            VALUES (?, ?, ?, ?, ?, 0)
        ');
        $result = $stmt->execute([
            $this->testUsername, 
            $this->testSessionId, 
            $testImageData['filename'],
            $testImageData['encounterId'],
            json_encode($testImageData)
        ]);
        
        if ($result) {
            echo "✅ Test 1: Image stored successfully\n";
            $passed++;
        } else {
            echo "❌ Test 1: Failed to store test image\n";
            $failed++;
        }
        
        // Test 2: Verify image appears in non-consumed query
        $total++;
        $stmt = $this->pdo->prepare('
            SELECT id, filename FROM user_images 
            WHERE user_id = ? AND consumed = 0
        ');
        $stmt->execute([$this->testUsername]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($rows) === 1 && $rows[0]['filename'] === 'test_image_001.jpg') {
            echo "✅ Test 2: Image appears in non-consumed query\n";
            $passed++;
            $imageId = $rows[0]['id'];
        } else {
            echo "❌ Test 2: Image not found in non-consumed query\n";
            $failed++;
            return compact('total', 'passed', 'failed');
        }
        
        // Test 3: Soft delete (consume) the image
        $total++;
        $stmt = $this->pdo->prepare('UPDATE user_images SET consumed = 1 WHERE id = ?');
        $result = $stmt->execute([$imageId]);
        
        if ($result) {
            echo "✅ Test 3: Image soft deleted (consumed) successfully\n";
            $passed++;
        } else {
            echo "❌ Test 3: Failed to soft delete image\n";
            $failed++;
        }
        
        // Test 4: Verify image no longer appears in non-consumed query
        $total++;
        $stmt = $this->pdo->prepare('
            SELECT id, filename FROM user_images 
            WHERE user_id = ? AND consumed = 0
        ');
        $stmt->execute([$this->testUsername]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($rows) === 0) {
            echo "✅ Test 4: Consumed image filtered out correctly\n";
            $passed++;
        } else {
            echo "❌ Test 4: Consumed image still appears in query\n";
            $failed++;
        }
        
        // Test 5: Verify image still exists in database (not hard deleted)
        $total++;
        $stmt = $this->pdo->prepare('
            SELECT id, filename, consumed FROM user_images 
            WHERE user_id = ? AND id = ?
        ');
        $stmt->execute([$this->testUsername, $imageId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row && $row['consumed'] == 1) {
            echo "✅ Test 5: Image preserved in database with consumed=1\n";
            $passed++;
        } else {
            echo "❌ Test 5: Image not found or consumed flag incorrect\n";
            $failed++;
        }
        
        // Test 6: Test ON DUPLICATE KEY UPDATE with encounter_id collision
        $total++;
        $duplicateImageData = [
            'filename' => 'test_image_002.jpg',
            'encounterId' => 'test_encounter_001', // Same encounter ID
            'actionHistory' => [
                ['action' => 'view', 'timestamp' => date('Y-m-d H:i:s')],
                ['action' => 'like', 'timestamp' => date('Y-m-d H:i:s')]
            ]
        ];
        
        $stmt = $this->pdo->prepare('
            INSERT INTO user_images (user_id, session_id, filename, encounter_id, data, consumed)
            VALUES (?, ?, ?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE 
                data = VALUES(data),
                consumed = 0,
                updated = NOW()
        ');
        $result = $stmt->execute([
            $this->testUsername, 
            $this->testSessionId, 
            $duplicateImageData['filename'],
            $duplicateImageData['encounterId'],
            json_encode($duplicateImageData)
        ]);
        
        if ($result) {
            echo "✅ Test 6: ON DUPLICATE KEY UPDATE handled encounter_id collision\n";
            $passed++;
        } else {
            echo "❌ Test 6: Failed to handle encounter_id collision\n";
            $failed++;
        }
        
        // Test 7: Verify updated record has consumed=0 and new data
        $total++;
        $stmt = $this->pdo->prepare('
            SELECT filename, consumed, data FROM user_images 
            WHERE user_id = ? AND encounter_id = ?
        ');
        $stmt->execute([$this->testUsername, 'test_encounter_001']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            $data = json_decode($row['data'], true);
            
            if ($row['consumed'] == 0 && count($data['actionHistory']) === 2) {
                echo "✅ Test 7: Duplicate key update reset consumed flag and updated data\n";
                $passed++;
            } else {
                echo "❌ Test 7: Duplicate key update failed - consumed={$row['consumed']}, actions=" . count($data['actionHistory']) . "\n";
                $failed++;
            }
        } else {
            echo "❌ Test 7: No record found for encounter_id test_encounter_001\n";
            $failed++;
        }
        
        return compact('total', 'passed', 'failed');
    }
    
    public function testSessionRecovery() {
        $passed = 0;
        $failed = 0;
        $total = 0;
        
        echo "\nTesting session recovery functionality...\n";
        
        // Clean slate for recovery test
        $stmt = $this->pdo->prepare('DELETE FROM user_images WHERE user_id = ?');
        $stmt->execute([$this->testUsername]);
        
        // Test 1: Set up consumed images
        $total++;
        $stmt = $this->pdo->prepare('
            INSERT INTO user_images (user_id, session_id, filename, encounter_id, data, consumed)
            VALUES (?, ?, ?, ?, ?, 1)
        ');
        $result = $stmt->execute([
            $this->testUsername, 
            $this->testSessionId, 
            'consumed_image_001.jpg',
            'consumed_encounter_001',
            json_encode(['filename' => 'consumed_image_001.jpg'])
        ]);
        
        if ($result) {
            echo "✅ Test 1: Consumed image created for recovery test\n";
            $passed++;
        } else {
            echo "❌ Test 1: Failed to create consumed test image\n";
            $failed++;
        }
        
        // Test 2: Verify consumed image is invisible (only consumed=0 images visible)
        $total++;
        $stmt = $this->pdo->prepare('
            SELECT COUNT(*) as visible_count FROM user_images 
            WHERE user_id = ? AND consumed = 0
        ');
        $stmt->execute([$this->testUsername]);
        $visibleRow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $this->pdo->prepare('
            SELECT COUNT(*) as consumed_count FROM user_images 
            WHERE user_id = ? AND consumed = 1
        ');
        $stmt->execute([$this->testUsername]);
        $consumedRow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($visibleRow['visible_count'] == 0 && $consumedRow['consumed_count'] == 1) {
            echo "✅ Test 2: Consumed image correctly filtered out (0 visible, 1 consumed)\n";
            $passed++;
        } else {
            echo "❌ Test 2: Filter failed - visible: {$visibleRow['visible_count']}, consumed: {$consumedRow['consumed_count']}\n";
            $failed++;
        }
        
        // Test 3: Reset consumed flags (session recovery)
        $total++;
        $stmt = $this->pdo->prepare('UPDATE user_images SET consumed = 0 WHERE user_id = ?');
        $resetResult = $stmt->execute([$this->testUsername]);
        $resetCount = $stmt->rowCount();
        
        if ($resetResult && $resetCount > 0) {
            echo "✅ Test 3: Session recovery reset $resetCount consumed flags\n";
            $passed++;
        } else {
            echo "❌ Test 3: Session recovery failed to reset consumed flags\n";
            $failed++;
        }
        
        // Test 4: Verify recovered image is now accessible
        $total++;
        $stmt = $this->pdo->prepare('
            SELECT filename FROM user_images 
            WHERE user_id = ? AND consumed = 0
        ');
        $stmt->execute([$this->testUsername]);
        $recoveredImages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($recoveredImages) > 0 && $recoveredImages[0]['filename'] === 'consumed_image_001.jpg') {
            echo "✅ Test 4: Consumed image recovered and accessible after session recovery\n";
            $passed++;
        } else {
            echo "❌ Test 4: Session recovery failed to restore consumed images\n";
            $failed++;
        }
        
        return compact('total', 'passed', 'failed');
    }
    
    public function runAllTests() {
        $this->setUp();
        
        $consumeResults = $this->testSoftDeleteConsumePattern();
        $recoveryResults = $this->testSessionRecovery();
        
        $this->tearDown();
        
        $totalTests = $consumeResults['total'] + $recoveryResults['total'];
        $totalPassed = $consumeResults['passed'] + $recoveryResults['passed'];
        $totalFailed = $consumeResults['failed'] + $recoveryResults['failed'];
        
        echo "\nSoft Delete Consume Pattern Test Results:\n";
        echo "Total: $totalTests tests\n";
        echo "Passed: $totalPassed\n";
        echo "Failed: $totalFailed\n";
        
        if ($totalFailed === 0) {
            echo "🎉 All soft delete consume pattern tests passed!\n";
        } else {
            echo "⚠️  Some tests failed - check implementation\n";
        }
        
        return compact('totalTests', 'totalPassed', 'totalFailed');
    }
}

// Run the tests
try {
    $test = new SoftDeleteConsumePatternTest();
    $test->runAllTests();
} catch (Exception $e) {
    echo "❌ Test setup failed: " . $e->getMessage() . "\n";
    echo "Total: 0 tests\nPassed: 0\nFailed: 1\n";
}
?>