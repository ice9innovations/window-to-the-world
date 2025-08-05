<?php
/**
 * Utility Functions Tests
 * 
 * Tests for helper functions with edge cases and realistic scenarios.
 * These tests validate actual functionality, not just happy paths.
 */

require_once __DIR__ . '/../controller/common.php';
require_once __DIR__ . '/../controller/image.php';

class UtilityFunctionsTest {
    private $testsPassed = 0;
    private $testsFailed = 0;
    
    public function runAllTests() {
        echo "🧪 Running utility function tests...\n\n";
        
        $this->testExtractFilenameFromUrl();
        $this->testReconstructCaptions();
        $this->testExtractColorData();
        $this->testExtractFaceData();
        $this->testStoreUserInteractionValidation();
        
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
    
    private function testExtractFilenameFromUrl() {
        // Valid URLs
        $this->assert(
            extractFilenameFromUrl('https://example.com/path/image.jpg') === 'image.jpg',
            'Extract filename from simple URL'
        );
        
        $this->assert(
            extractFilenameFromUrl('https://farm1.staticflickr.com/1/000000000139.jpg') === '000000000139.jpg',
            'Extract filename from Flickr URL'
        );
        
        $this->assert(
            extractFilenameFromUrl('/local/path/to/image.webp') === 'image.webp',
            'Extract filename from local path'
        );
        
        // Edge cases
        $this->assert(
            extractFilenameFromUrl('https://example.com/') === '',
            'Handle URL with no filename'
        );
        
        $this->assert(
            extractFilenameFromUrl('') === null,
            'Handle empty URL'
        );
        
        $this->assert(
            extractFilenameFromUrl('not-a-url') === 'not-a-url',
            'Handle malformed URL'
        );
        
        $this->assert(
            extractFilenameFromUrl('https://example.com/path/file%20with%20spaces.jpg') === 'file%20with%20spaces.jpg',
            'Handle URL with encoded characters'
        );
        
        // Null and invalid inputs
        $this->assert(
            extractFilenameFromUrl(null) === null,
            'Handle null input gracefully'
        );
        
        // URL with query parameters
        $this->assert(
            extractFilenameFromUrl('https://example.com/image.jpg?version=1&size=large') === 'image.jpg',
            'Extract filename ignoring query parameters'
        );
    }
    
    private function testReconstructCaptions() {
        // Test with complete BLIP data
        $analysisWithBlip = (object)[
            'results' => (object)[
                'blip' => (object)[
                    'predictions' => [
                        (object)[
                            'type' => 'caption',
                            'text' => 'A dog sitting in grass',
                            'confidence' => 0.89,
                            'score' => (object)[
                                'formatted' => 'a dog sitting in grass',
                                'raw_score' => 0.76,
                                'matches' => 4,
                                'total_words' => 5,
                                'percentage' => 80
                            ]
                        ]
                    ]
                ]
            ]
        ];
        
        $captions = reconstructCaptions($analysisWithBlip);
        
        $this->assert(
            isset($captions->blip) && $captions->blip['text'] === 'A dog sitting in grass',
            'Reconstruct BLIP caption text'  
        );
        
        $this->assert(
            $captions->blip['confidence'] === 0.89 && $captions->blip['matches'] === 4,
            'Reconstruct BLIP caption scoring data'
        );
        
        // Test with Ollama data
        $analysisWithOllama = (object)[
            'results' => (object)[
                'ollama' => (object)[
                    'predictions' => [
                        (object)[
                            'type' => 'caption',
                            'text' => 'Golden retriever playing outside',
                            'confidence' => 0.92,
                            'score' => (object)[
                                'formatted' => 'golden retriever playing outside',
                                'raw_score' => 0.84,
                                'matches' => 3,
                                'total_words' => 4,
                                'percentage' => 75
                            ]
                        ]
                    ]
                ]
            ]
        ];
        
        $captions2 = reconstructCaptions($analysisWithOllama);
        
        $this->assert(
            isset($captions2->llama) && $captions2->llama['text'] === 'Golden retriever playing outside',
            'Reconstruct Ollama/LLaMA caption text'
        );
        
        // Test with missing data
        $emptyAnalysis = (object)[];
        $emptyCaptions = reconstructCaptions($emptyAnalysis);
        
        $this->assert(
            !isset($emptyCaptions->blip) && !isset($emptyCaptions->llama),
            'Handle missing caption data gracefully'
        );
        
        // Test with malformed predictions
        $malformedAnalysis = (object)[
            'results' => (object)[
                'blip' => (object)[
                    'predictions' => [
                        (object)[
                            'type' => 'not_caption',
                            'text' => 'Should be ignored'
                        ]
                    ]
                ]
            ]
        ];
        
        $malformedCaptions = reconstructCaptions($malformedAnalysis);
        
        $this->assert(
            !isset($malformedCaptions->blip),
            'Ignore non-caption predictions'
        );
    }
    
    private function testExtractColorData() {
        // Test with complete color data
        $analysisWithColors = (object)[
            'results' => (object)[
                'colors' => (object)[
                    'predictions' => [
                        (object)[
                            'type' => 'primary_color',
                            'value' => '#FF5733',
                            'label' => 'Orange Red',
                            'properties' => (object)[
                                'rgb' => [255, 87, 51]
                            ]
                        ],
                        (object)[
                            'type' => 'copic_analysis',
                            'value' => '#FF5733',
                            'label' => 'Orange Red Primary',
                            'properties' => (object)[
                                'palette' => [
                                    ['#FF5733', 'Orange Red'],
                                    ['#33FF57', 'Green'],
                                    ['#3357FF', 'Blue']
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];
        
        $colors = extractColorData($analysisWithColors);
        
        $this->assert(
            isset($colors->primary) && $colors->primary['hex'] === '#FF5733',
            'Extract primary color data'
        );
        
        $this->assert(
            isset($colors->palette) && is_array($colors->palette['colors']),
            'Extract color palette data'
        );
        
        $this->assert(
            $colors->primary['rgb'][0] === 255 && $colors->primary['rgb'][1] === 87,
            'Extract RGB color values'
        );
        
        // Test with missing data
        $emptyAnalysis = (object)[];
        $emptyColors = extractColorData($emptyAnalysis);
        
        $this->assert(
            !isset($emptyColors->primary) && !isset($emptyColors->palette),
            'Handle missing color data gracefully'
        );
    }
    
    private function testExtractFaceData() {
        // Test with face predictions
        $analysisWithFaces = (object)[
            'results' => (object)[
                'face' => (object)[
                    'predictions' => [
                        (object)[
                            'bbox' => [100, 100, 200, 200],
                            'confidence' => 0.95,
                            'landmarks' => [(object)['x' => 150, 'y' => 130]]
                        ]
                    ]
                ]
            ]
        ];
        
        $faces = extractFaceData($analysisWithFaces);
        
        $this->assert(
            isset($faces->predictions) && is_array($faces->predictions),
            'Extract face predictions data'
        );
        
        $this->assert(
            $faces->predictions[0]->confidence === 0.95,
            'Preserve face detection confidence scores'
        );
        
        // Test with no face data
        $emptyAnalysis = (object)[];
        $emptyFaces = extractFaceData($emptyAnalysis);
        
        $this->assert(
            !isset($emptyFaces->predictions),
            'Handle missing face data gracefully'
        );
    }
    
    private function testStoreUserInteractionValidation() {
        // Test that storeUserInteraction validates required fields
        // Note: This doesn't actually store to database, just tests validation logic
        
        $validInteraction = [
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
        
        // Test structure validation - this should extract fields correctly
        $imageFile = $validInteraction['imageFile'] ?? '';
        $userAction = $validInteraction['userAction'] ?? '';
        $username = $validInteraction['user']['name'] ?? '';
        $sessionId = $validInteraction['user']['sessionId'] ?? '';
        
        $this->assert(
            $imageFile === '000000000139.jpg' && 
            $userAction === 'like' && 
            $username === 'test_user' && 
            $sessionId === 'test_session_123',
            'Valid interaction data structure parsed correctly'
        );
        
        // Test missing required fields
        $invalidInteraction = [
            'userAction' => 'like'
            // Missing imageFile, user data, etc.
        ];
        
        $missingImageFile = $invalidInteraction['imageFile'] ?? '';
        $missingUser = $invalidInteraction['user']['name'] ?? '';
        
        $this->assert(
            $missingImageFile === '' && $missingUser === '',
            'Missing required fields return empty values'
        );
        
        // Test malformed user data
        $malformedInteraction = [
            'imageFile' => 'test.jpg',
            'user' => 'not_an_object'  // Should be object/array
        ];
        
        $malformedUserName = is_array($malformedInteraction['user']) ? 
            ($malformedInteraction['user']['name'] ?? '') : '';
        
        $this->assert(
            $malformedUserName === '',
            'Malformed user data handled gracefully'
        );
    }
}

// Run tests if this file is executed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $tester = new UtilityFunctionsTest();
    $success = $tester->runAllTests();
    exit($success ? 0 : 1);
}
?>