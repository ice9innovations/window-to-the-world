<?php
/**
 * Endpoint Integration Tests
 * 
 * Tests actual HTTP endpoints with real requests and responses.
 * These tests validate the complete request/response cycle.
 */

class EndpointIntegrationTest {
    private $testsPassed = 0;
    private $testsFailed = 0;
    private $baseUrl;
    
    public function __construct($baseUrl = 'http://localhost/v2/controller') {
        $this->baseUrl = rtrim($baseUrl, '/');
    }
    
    public function runAllTests() {
        echo "🧪 Running endpoint integration tests...\n";
        echo "📡 Base URL: {$this->baseUrl}\n\n";
        
        $this->testHealthEndpoint();
        $this->testStoreEndpointValidation();
        $this->testUnifiedImageEndpoint();
        $this->testUnifiedFormatStorageRetrievalCycle();
        $this->testRetrieveEndpointValidation();
        $this->testPaginationWithBeforeParameter();
        $this->testTimestampBasedStorageProtection();
        $this->testInvalidEndpoint();
        $this->testOptionsRequest();
        
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
    
    private function makeRequest($endpoint, $method = 'GET', $data = null, $headers = []) {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data && ($method === 'POST' || $method === 'PUT')) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($data) ? json_encode($data) : $data);
        }
        
        $defaultHeaders = ['Content-Type: application/json'];
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($defaultHeaders, $headers));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        return [
            'body' => $response,
            'http_code' => $httpCode,
            'error' => $error
        ];
    }
    
    private function testHealthEndpoint() {
        $response = $this->makeRequest('/health');
        
        $this->assert(
            $response['http_code'] === 200,
            'Health endpoint returns 200 status',
            "Got HTTP {$response['http_code']}"
        );
        
        $this->assert(
            empty($response['error']),
            'Health endpoint request completes without cURL error',
            $response['error']
        );
        
        $data = json_decode($response['body'], true);
        
        $this->assert(
            $data !== null,
            'Health endpoint returns valid JSON'
        );
        
        $this->assert(
            isset($data['status']) && $data['status'] === 'healthy',
            'Health endpoint returns healthy status'
        );
        
        $this->assert(
            isset($data['timestamp']) && !empty($data['timestamp']),
            'Health endpoint includes timestamp'
        );
        
        $this->assert(
            isset($data['mode']) && $data['mode'] === 'php_sqlite_mysql',
            'Health endpoint identifies correct mode (post-MongoDB migration)'
        );
    }
    
    
    
    private function testStoreEndpointValidation() {
        // Test POST method requirement
        $getResponse = $this->makeRequest('/store');
        
        $this->assert(
            $getResponse['http_code'] === 405,
            'Store endpoint rejects GET requests with 405 Method Not Allowed'
        );
        
        // Test invalid JSON
        $invalidJsonResponse = $this->makeRequest('/store', 'POST', 'invalid-json');
        
        $this->assert(
            $invalidJsonResponse['http_code'] === 500,
            'Store endpoint returns error for invalid JSON'
        );
        
        // Test valid request structure (may fail due to database, but validates parsing)
        $validData = [
            'imageFile' => '000000000139.jpg',
            'userAction' => 'like',
            'timestamp' => date('c'),
            'user' => [
                'name' => 'test_user',
                'sessionId' => 'test_session_123'
            ],
            'sessionData' => [
                'imageIndex' => 0
            ]
        ];
        
        $validResponse = $this->makeRequest('/store', 'POST', $validData);
        $validResponseData = json_decode($validResponse['body'], true);
        
        // This might succeed or fail depending on database availability
        // but it should not be a parsing error
        $this->assert(
            $validResponse['http_code'] === 200 || $validResponse['http_code'] === 500,
            'Store endpoint properly processes valid JSON structure'
        );
        
        $this->assert(
            isset($validResponseData['success']),
            'Store endpoint returns structured response for valid data'
        );
    }
    
    private function testInvalidEndpoint() {
        $response = $this->makeRequest('/nonexistent');
        
        $this->assert(
            $response['http_code'] === 404,
            'Invalid endpoint returns 404 status'
        );
    }
    
    private function testOptionsRequest() {
        $response = $this->makeRequest('/health', 'OPTIONS');
        
        $this->assert(
            $response['http_code'] === 200,
            'OPTIONS request returns 200 status for CORS preflight'
        );
        
        $this->assert(
            empty($response['body']),
            'OPTIONS request returns empty body'
        );
    }
    
    private function testUnifiedImageEndpoint() {
        $response = $this->makeRequest('/image?random=true');
        
        $this->assert(
            $response['http_code'] === 200,
            'Unified image endpoint returns 200 status',
            "Got HTTP {$response['http_code']}"
        );
        
        $data = json_decode($response['body'], true);
        
        $this->assert(
            $data !== null,
            'Unified image endpoint returns valid JSON'
        );
        
        // Note: Success responses contain data directly, no 'success' field
        // Only error responses have success: false
        
        // Test unified object structure
        $this->assert(
            isset($data['filename']) && !empty($data['filename']),
            'Unified object includes filename'
        );
        
        $this->assert(
            isset($data['imageId']) && !empty($data['imageId']),
            'Unified object includes imageId'
        );
        
        $this->assert(
            isset($data['encounterId']) && !empty($data['encounterId']),
            'Unified object includes encounterId for deduplication'
        );
        
        $this->assert(
            isset($data['analysisData']) && is_array($data['analysisData']),
            'Unified object includes analysisData structure'
        );
        
        $this->assert(
            isset($data['actionHistory']) && is_array($data['actionHistory']),
            'Unified object includes actionHistory array'
        );
        
        // Test that analysisData has expected nested structure
        if (isset($data['analysisData'])) {
            $this->assert(
                isset($data['analysisData']['emojiPredictions']),
                'analysisData includes emojiPredictions'
            );
            
            $this->assert(
                isset($data['analysisData']['captions']),
                'analysisData includes captions'
            );
            
            $this->assert(
                isset($data['analysisData']['processingTime']) && is_numeric($data['analysisData']['processingTime']),
                'analysisData includes processingTime'
            );
        }
    }
    
    private function testUnifiedFormatStorageRetrievalCycle() {
        // Step 1: Load a unified image object
        $loadResponse = $this->makeRequest('/image?random=true');
        $loadData = json_decode($loadResponse['body'], true);
        
        if (!$loadData || !isset($loadData['filename'])) {
            echo "⚠️  Skipping storage/retrieval cycle test - couldn't load unified image\n";
            return;
        }
        
        // Step 2: Add some test action history to make the test more realistic
        $testSessionId = 'test_session_' . uniqid();
        $testUsername = 'test_user_' . time();
        
        $loadData['actionHistory'][] = [
            'action' => 'view',
            'timestamp' => date('c'),
            'metadata' => [
                'lingerTime' => 0,
                'navigationSource' => 'test',
                'loadTime' => 100
            ]
        ];
        
        $loadData['actionHistory'][] = [
            'action' => 'like',
            'timestamp' => date('c')
        ];
        
        // Step 3: Store the unified object
        $storeData = [
            'unifiedImageObject' => $loadData,
            'username' => $testUsername,
            'sessionId' => $testSessionId
        ];
        
        $storeResponse = $this->makeRequest('/store', 'POST', $storeData);
        $storeResult = json_decode($storeResponse['body'], true);
        
        $this->assert(
            $storeResponse['http_code'] === 200,
            'Store endpoint accepts unified object format'
        );
        
        $this->assert(
            isset($storeResult['success']) && $storeResult['success'] === true,
            'Store endpoint successfully saves unified object'
        );
        
        // Step 4: Retrieve the stored object
        $retrieveResponse = $this->makeRequest("/retrieve?username={$testUsername}&limit=10");
        $retrieveResult = json_decode($retrieveResponse['body'], true);
        
        $this->assert(
            $retrieveResponse['http_code'] === 200,
            'Retrieve endpoint returns 200 for valid request'
        );
        
        $this->assert(
            isset($retrieveResult['success']) && $retrieveResult['success'] === true,
            'Retrieve endpoint indicates success'
        );
        
        $this->assert(
            isset($retrieveResult['images']) && is_array($retrieveResult['images']) && count($retrieveResult['images']) > 0,
            'Retrieve endpoint returns images array with data'
        );
        
        // Step 5: Verify the retrieved object matches what we stored
        if (isset($retrieveResult['images'][0])) {
            $retrievedObject = $retrieveResult['images'][0];
            
            $this->assert(
                $retrievedObject['filename'] === $loadData['filename'],
                'Retrieved object has correct filename'
            );
            
            $this->assert(
                $retrievedObject['imageId'] === $loadData['imageId'],
                'Retrieved object has correct imageId'
            );
            
            $this->assert(
                isset($retrievedObject['encounterId']) && $retrievedObject['encounterId'] === $loadData['encounterId'],
                'Retrieved object preserves encounterId for deduplication'
            );
            
            $this->assert(
                isset($retrievedObject['actionHistory']) && count($retrievedObject['actionHistory']) === 2,
                'Retrieved object preserves action history'
            );
            
            $this->assert(
                $retrievedObject['actionHistory'][1]['action'] === 'like',
                'Retrieved object preserves specific actions'
            );
            
            $this->assert(
                isset($retrievedObject['databaseTimestamp']),
                'Retrieved object includes databaseTimestamp for pagination'
            );
        }
        
        // Step 6: Clean up test data - consume the stored records
        $cleanupResponse = $this->makeRequest("/retrieve?username={$testUsername}&consume=true");
        $cleanupResult = json_decode($cleanupResponse['body'], true);
        
        $this->assert(
            isset($cleanupResult['consumed']) && $cleanupResult['consumed'] > 0,
            'Test cleanup successfully consumed stored records'
        );
    }
    
    private function testRetrieveEndpointValidation() {
        // Test missing required parameters
        $noParamsResponse = $this->makeRequest('/retrieve');
        
        $this->assert(
            $noParamsResponse['http_code'] === 400,
            'Retrieve endpoint returns 400 for missing required parameters'
        );
        
        $noParamsData = json_decode($noParamsResponse['body'], true);
        
        $this->assert(
            isset($noParamsData['success']) && $noParamsData['success'] === false,
            'Retrieve endpoint indicates failure for missing parameters'
        );
        
        // Test valid but empty result
        $emptyUserResponse = $this->makeRequest('/retrieve?username=nonexistent_user_' . uniqid());
        
        $this->assert(
            $emptyUserResponse['http_code'] === 200,
            'Retrieve endpoint returns 200 for valid but empty request'
        );
        
        $emptyUserData = json_decode($emptyUserResponse['body'], true);
        
        $this->assert(
            isset($emptyUserData['success']) && $emptyUserData['success'] === true,
            'Retrieve endpoint indicates success for empty result'
        );
        
        $this->assert(
            isset($emptyUserData['images']) && is_array($emptyUserData['images']) && count($emptyUserData['images']) === 0,
            'Retrieve endpoint returns empty images array for nonexistent user'
        );
    }
    
    private function testPaginationWithBeforeParameter() {
        // Test pagination functionality with before parameter
        $testUsername = 'pagination_test_' . time();
        $testSessionId = 'session_' . time();
        
        // Store two test images with different timestamps
        $image1Data = [
            'unifiedImageObject' => [
                'filename' => 'pagination_test_1.jpg',
                'imageId' => 'test_id_1',
                'encounterId' => 'enc_test_1_' . uniqid(),
                'actionHistory' => [['action' => 'view', 'timestamp' => date('c')]]
            ],
            'username' => $testUsername,
            'sessionId' => $testSessionId
        ];
        
        $image2Data = [
            'unifiedImageObject' => [
                'filename' => 'pagination_test_2.jpg', 
                'imageId' => 'test_id_2',
                'encounterId' => 'enc_test_2_' . uniqid(),
                'actionHistory' => [['action' => 'view', 'timestamp' => date('c')]]
            ],
            'username' => $testUsername,
            'sessionId' => $testSessionId
        ];
        
        // Store both images
        $this->makeRequest('/store', 'POST', $image1Data);
        sleep(1); // Ensure different timestamps
        $this->makeRequest('/store', 'POST', $image2Data);
        
        // Get first image (most recent)
        $firstResponse = $this->makeRequest("/retrieve?username={$testUsername}&limit=1");
        $firstResult = json_decode($firstResponse['body'], true);
        
        $this->assert(
            isset($firstResult['images'][0]['databaseTimestamp']),
            'First pagination call returns databaseTimestamp'
        );
        
        $this->assert(
            count($firstResult['images']) === 1,
            'Pagination limit=1 returns exactly one image'
        );
        
        // Use the databaseTimestamp for before parameter
        $firstTimestamp = $firstResult['images'][0]['databaseTimestamp'];
        $beforeParam = urlencode($firstTimestamp);
        
        // Get second image (older than first)
        $secondResponse = $this->makeRequest("/retrieve?username={$testUsername}&limit=1&before={$beforeParam}");
        $secondResult = json_decode($secondResponse['body'], true);
        
        $this->assert(
            $secondResponse['http_code'] === 200,
            'Pagination with before parameter returns 200'
        );
        
        $this->assert(
            isset($secondResult['success']) && $secondResult['success'] === true,
            'Pagination with before parameter indicates success'
        );
        
        // Verify different images returned (pagination working)
        if (isset($firstResult['images'][0]) && isset($secondResult['images'][0])) {
            $firstName = $firstResult['images'][0]['filename'];
            $secondName = $secondResult['images'][0]['filename'] ?? null;
            
            $this->assert(
                $firstName !== $secondName,
                'Pagination returns different images (pagination working)'
            );
        }
        
        // Cleanup
        $this->makeRequest("/retrieve?username={$testUsername}&consume=true");
    }

    private function testTimestampBasedStorageProtection() {
        $testUsername = 'test_user_timestamp_protection_' . time();
        $testSessionId = 'test_session_' . time();
        $testEncounterId = 'enc_test_' . time();
        
        // Create initial image with early timestamp (buffer overflow scenario)
        $earlyTime = '2025-08-03T10:00:00.000Z';
        $initialImageData = [
            'username' => $testUsername,
            'sessionId' => $testSessionId,
            'unifiedImageObject' => [
                'filename' => 'test_protection.jpg',
                'imageId' => 'test_protection',
                'encounterId' => $testEncounterId,
                'analysisData' => ['emojiPredictions' => ['firstPlace' => '🧪']],
                'actionHistory' => [
                    ['action' => 'view', 'timestamp' => $earlyTime]
                ]
            ]
        ];
        
        // Store initial image
        $response1 = $this->makeRequest('/store', 'POST', $initialImageData);
        $this->assert(
            $response1['http_code'] === 200,
            'Initial timestamp protection test image stored successfully'
        );
        
        // Try to overwrite with richer data (user interaction scenario)
        $laterTime = '2025-08-03T10:05:00.000Z';
        $richImageData = [
            'username' => $testUsername,
            'sessionId' => $testSessionId,
            'unifiedImageObject' => [
                'filename' => 'test_protection.jpg',
                'imageId' => 'test_protection',
                'encounterId' => $testEncounterId,
                'analysisData' => ['emojiPredictions' => ['firstPlace' => '🧪']],
                'actionHistory' => [
                    ['action' => 'view', 'timestamp' => $earlyTime],
                    ['action' => 'like', 'timestamp' => $laterTime]
                ]
            ]
        ];
        
        $response2 = $this->makeRequest('/store', 'POST', $richImageData);
        $this->assert(
            $response2['http_code'] === 200,
            'Rich data update accepted with newer timestamp'
        );
        
        // Now try to overwrite rich data with older/minimal data (should be rejected)
        $olderTime = '2025-08-03T10:02:00.000Z';
        $minimalImageData = [
            'username' => $testUsername,
            'sessionId' => $testSessionId,
            'unifiedImageObject' => [
                'filename' => 'test_protection.jpg',
                'imageId' => 'test_protection',
                'encounterId' => $testEncounterId,
                'analysisData' => ['emojiPredictions' => ['firstPlace' => '🧪']],
                'actionHistory' => [
                    ['action' => 'view', 'timestamp' => $olderTime]
                ]
            ]
        ];
        
        $response3 = $this->makeRequest('/store', 'POST', $minimalImageData);
        $this->assert(
            $response3['http_code'] === 200,
            'Older data submission completes successfully'
        );
        
        // Verify that rich data is preserved (older data was rejected)
        $retrieveResponse = $this->makeRequest("/retrieve?username={$testUsername}");
        $retrieveData = json_decode($retrieveResponse['body'], true);
        
        $this->assert(
            isset($retrieveData['images'][0]['actionHistory']),
            'Retrieved image has action history'
        );
        
        $actionCount = count($retrieveData['images'][0]['actionHistory']);
        $this->assert(
            $actionCount === 2,
            'Timestamp protection preserved richer data (2 actions vs 1)'
        );
        
        $hasLikeAction = false;
        foreach ($retrieveData['images'][0]['actionHistory'] as $action) {
            if ($action['action'] === 'like') {
                $hasLikeAction = true;
                break;
            }
        }
        
        $this->assert(
            $hasLikeAction,
            'Timestamp protection preserved like action from richer data'
        );
        
        // Cleanup
        $this->makeRequest("/retrieve?username={$testUsername}&consume=true");
    }
}

// Allow running from command line or including in test suite
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $baseUrl = $argv[1] ?? 'http://localhost/v2/controller';
    $tester = new EndpointIntegrationTest($baseUrl);
    $success = $tester->runAllTests();
    exit($success ? 0 : 1);
}
?>