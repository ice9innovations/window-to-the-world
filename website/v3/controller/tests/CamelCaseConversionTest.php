<?php
/**
 * Tests for toCamelCase conversion function
 * 
 * These tests ensure that snake_case database fields are properly
 * converted to camelCase for frontend consumption.
 */

require_once __DIR__ . '/../controller/common.php';

class CamelCaseConversionTest {
    
    private $testResults = [];
    
    public function runAllTests() {
        echo "Running CamelCase Conversion Tests...\n\n";
        
        $this->testBasicArrayConversion();
        $this->testBasicObjectConversion();
        $this->testNestedObjectConversion();
        $this->testNestedArrayConversion();
        $this->testMixedNestedStructures();
        $this->testEmptyInputs();
        $this->testPrimitiveValues();
        $this->testEmojiPredictionsStructure();
        $this->testImageDataStructure();
        
        return $this->printResults();
    }
    
    private function assert($condition, $testName, $expected = null, $actual = null) {
        if ($condition) {
            $this->testResults[] = "✅ PASS: $testName";
            return true;
        } else {
            $message = "❌ FAIL: $testName";
            if ($expected !== null && $actual !== null) {
                $message .= "\n   Expected: " . json_encode($expected);
                $message .= "\n   Actual: " . json_encode($actual);
            }
            $this->testResults[] = $message;
            return false;
        }
    }
    
    public function testBasicArrayConversion() {
        $input = [
            'snake_case_key' => 'value1',
            'another_snake_key' => 'value2'
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result['snakeCaseKey']) && $result['snakeCaseKey'] === 'value1',
            'Basic array: snake_case_key → snakeCaseKey'
        );
        
        $this->assert(
            isset($result['anotherSnakeKey']) && $result['anotherSnakeKey'] === 'value2',
            'Basic array: another_snake_key → anotherSnakeKey'
        );
    }
    
    public function testBasicObjectConversion() {
        $input = (object)[
            'object_property' => 'test_value',
            'another_prop' => 42
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result->objectProperty) && $result->objectProperty === 'test_value',
            'Basic object: object_property → objectProperty'
        );
        
        $this->assert(
            isset($result->anotherProp) && $result->anotherProp === 42,
            'Basic object: another_prop → anotherProp'
        );
    }
    
    public function testNestedObjectConversion() {
        $input = (object)[
            'outer_object' => (object)[
                'inner_property' => 'nested_value',
                'deep_nesting' => (object)[
                    'very_deep_prop' => 'deep_value'
                ]
            ]
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result->outerObject->innerProperty) && 
            $result->outerObject->innerProperty === 'nested_value',
            'Nested object: outer_object.inner_property → outerObject.innerProperty'
        );
        
        $this->assert(
            isset($result->outerObject->deepNesting->veryDeepProp) && 
            $result->outerObject->deepNesting->veryDeepProp === 'deep_value',
            'Deep nested object: very_deep_prop → veryDeepProp'
        );
    }
    
    public function testNestedArrayConversion() {
        $input = [
            'array_prop' => [
                'nested_array_key' => 'array_value',
                'sub_array' => [
                    'deep_array_key' => 'deep_array_value'
                ]
            ]
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result['arrayProp']['nestedArrayKey']) && 
            $result['arrayProp']['nestedArrayKey'] === 'array_value',
            'Nested array: array_prop.nested_array_key → arrayProp.nestedArrayKey'
        );
    }
    
    public function testMixedNestedStructures() {
        $input = [
            'mixed_structure' => (object)[
                'object_in_array' => ['array_in_object' => 'mixed_value']
            ]
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result['mixedStructure']->objectInArray['arrayInObject']) && 
            $result['mixedStructure']->objectInArray['arrayInObject'] === 'mixed_value',
            'Mixed structures: object in array in object conversion'
        );
    }
    
    public function testEmptyInputs() {
        $emptyArray = toCamelCase([]);
        $emptyObject = toCamelCase(new stdClass());
        
        $this->assert(
            is_array($emptyArray) && empty($emptyArray),
            'Empty array remains empty array'
        );
        
        $this->assert(
            is_object($emptyObject) && count((array)$emptyObject) === 0,
            'Empty object remains empty object'
        );
    }
    
    public function testPrimitiveValues() {
        $this->assert(
            toCamelCase('string') === 'string',
            'String primitives pass through unchanged'
        );
        
        $this->assert(
            toCamelCase(42) === 42,
            'Integer primitives pass through unchanged'
        );
        
        $this->assert(
            toCamelCase(null) === null,
            'Null values pass through unchanged'
        );
    }
    
    public function testEmojiPredictionsStructure() {
        // Test the actual structure we expect from the database
        $input = (object)[
            'emoji_predictions' => (object)[
                'first_place' => ['🐶', '🐱', '🦁'],
                'second_place' => ['🚗', '🏠', '🌟'],
                'confidence_scores' => [0.95, 0.87, 0.76]
            ]
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result->emojiPredictions->firstPlace) &&
            $result->emojiPredictions->firstPlace === ['🐶', '🐱', '🦁'],
            'Emoji predictions: first_place → firstPlace with emoji array'
        );
        
        $this->assert(
            isset($result->emojiPredictions->confidenceScores) &&
            $result->emojiPredictions->confidenceScores === [0.95, 0.87, 0.76],
            'Emoji predictions: confidence_scores → confidenceScores'
        );
    }
    
    public function testImageDataStructure() {
        // Test the actual image_data structure from database
        $input = (object)[
            'image_data' => (object)[
                'image_dimensions' => (object)[
                    'width' => 640,
                    'height' => 480
                ],
                'file_size' => 1024,
                'creation_date' => '2025-07-29'
            ]
        ];
        
        $result = toCamelCase($input);
        
        $this->assert(
            isset($result->imageData->imageDimensions->width) &&
            $result->imageData->imageDimensions->width === 640,
            'Image data: image_data.image_dimensions.width → imageData.imageDimensions.width'
        );
        
        $this->assert(
            isset($result->imageData->fileSize) &&
            $result->imageData->fileSize === 1024,
            'Image data: file_size → fileSize'
        );
    }
    
    private function printResults() {
        echo "\n" . str_repeat("=", 50) . "\n";
        echo "TEST RESULTS\n";
        echo str_repeat("=", 50) . "\n";
        
        $passed = 0;
        $failed = 0;
        
        foreach ($this->testResults as $result) {
            echo $result . "\n";
            if (strpos($result, '✅ PASS') === 0) {
                $passed++;
            } else {
                $failed++;
            }
        }
        
        echo str_repeat("-", 50) . "\n";
        echo "Total: " . ($passed + $failed) . " tests\n";
        echo "Passed: $passed\n";
        echo "Failed: $failed\n";
        
        if ($failed === 0) {
            echo "\n🎉 ALL TESTS PASSED! 🎉\n";
            return true;
        } else {
            echo "\n⚠️  SOME TESTS FAILED ⚠️\n";
            return false;
        }
    }
}

// Run tests if called directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $tester = new CamelCaseConversionTest();
    $tester->runAllTests();
}
?>