<?php
// Animal Farm v2 - Unified Image Endpoint

require_once __DIR__ . '/common.php';

// Image format conversion utilities
function convertToWebp($filename) {
    return preg_replace('/\.(jpe?g)$/i', '.webp', $filename);
}

function convertToJpg($filename) {
    return preg_replace('/\.webp$/i', '.jpg', $filename);
}

function extractFilenameFromUrl($imageUrl) {
    if (empty($imageUrl) || $imageUrl === null) {
        return null;
    }
    
    $parsed = parse_url($imageUrl);
    if (!$parsed || !isset($parsed['path'])) {
        return null;
    }
    return basename($parsed['path']);
}

function getAnalysisFromSQLite($filename) {
    $pdo = connectSQLite();
    if (!$pdo) {
        return null;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT filename, analysis_data, guid, timestamp FROM images WHERE filename = ? LIMIT 1");
        $stmt->execute([$filename]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return null;
        }
        
        $analysisData = json_decode($row['analysis_data']);
        
        return (object)[
            'filename' => $row['filename'],
            'imageId' => $analysisData->image_id ?? $row['guid'], // Extract from JSON or fallback to guid
            'timestamp' => $row['timestamp'],
            'analysisTime' => $analysisData->analysis_time ?? 0, // Extract from JSON
            'analysis' => $analysisData
        ];
        
    } catch (Exception $e) {
        error_log("SQLite query error: " . $e->getMessage());
        return null;
    }
}

function getRandomImageFromSQLite() {
    $pdo = connectSQLite();
    if (!$pdo) {
        return null;
    }
    
    try {
        // Cache all filenames from file for instant random selection
        static $cachedFilenames = null;
        if ($cachedFilenames === null) {
            $cacheFile = '/var/www/db/image_filenames_cache.txt';
            
            // Try to load from cache file first
            if (file_exists($cacheFile)) {
                $cachedFilenames = file($cacheFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                error_log("Loaded " . count($cachedFilenames) . " filenames from cache file");
            } else {
                // Rebuild cache from database (only when cache doesn't exist)
                $stmt = $pdo->prepare("SELECT filename FROM images");
                $stmt->execute();
                $cachedFilenames = $stmt->fetchAll(PDO::FETCH_COLUMN);
                
                // Save to cache file
                file_put_contents($cacheFile, implode("\n", $cachedFilenames));
                error_log("Created cache file with " . count($cachedFilenames) . " filenames");
            }
        }
        
        if (empty($cachedFilenames)) {
            return null;
        }
        
        // Instant random selection from memory cache
        $randomFilename = $cachedFilenames[array_rand($cachedFilenames)];
        
        // Single fast lookup by filename
        $stmt = $pdo->prepare("SELECT filename, analysis_data, guid, timestamp FROM images WHERE filename = ? LIMIT 1");
        $stmt->execute([$randomFilename]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            return null;
        }
        
        $analysisData = json_decode($row['analysis_data']);
        
        return (object)[
            'filename' => $row['filename'],
            'imageId' => $analysisData->image_id ?? $row['guid'], // Extract from JSON or fallback to guid
            'timestamp' => $row['timestamp'],
            'analysisTime' => $analysisData->analysis_time ?? 0, // Extract from JSON
            'analysis' => $analysisData
        ];
        
    } catch (Exception $e) {
        error_log("SQLite random query error: " . $e->getMessage());
        return null;
    }
}

function reconstructCaptionsCamelCase($analysis) {
    $captions = [];
    
    if (isset($analysis->results->blip->predictions)) {
        foreach ($analysis->results->blip->predictions as $prediction) {
            if ($prediction->type === 'caption') {
                $captions['blip'] = [
                    'text' => $prediction->text,
                    'formatted' => $prediction->score->formatted ?? $prediction->text,
                    'confidence' => $prediction->confidence,
                    'rawScore' => $prediction->score->raw_score ?? 0,
                    'matches' => $prediction->score->matches ?? 0,
                    'totalWords' => $prediction->score->total_words ?? 0,
                    'percentage' => $prediction->score->percentage ?? 0
                ];
                break;
            }
        }
    }
    
    if (isset($analysis->results->ollama->predictions)) {
        foreach ($analysis->results->ollama->predictions as $prediction) {
            if ($prediction->type === 'caption') {
                $captions['llama'] = [
                    'text' => $prediction->text,
                    'formatted' => $prediction->score->formatted ?? $prediction->text,
                    'confidence' => $prediction->confidence,
                    'rawScore' => $prediction->score->raw_score ?? 0,
                    'matches' => $prediction->score->matches ?? 0,
                    'totalWords' => $prediction->score->total_words ?? 0,
                    'percentage' => $prediction->score->percentage ?? 0
                ];
                break;
            }
        }
    }
    
    return $captions;
}

function extractColorDataCamelCase($analysis) {
    $colors = [];
    
    if (isset($analysis->results->colors->predictions)) {
        foreach ($analysis->results->colors->predictions as $prediction) {
            if ($prediction->type === 'primary_color') {
                $colors['primary'] = [
                    'hex' => $prediction->value,
                    'label' => $prediction->label,
                    'rgb' => $prediction->properties->rgb ?? []
                ];
            } elseif ($prediction->type === 'copic_analysis') {
                $colors['palette'] = [
                    'primaryColor' => $prediction->value,
                    'primaryLabel' => $prediction->label,
                    'colors' => $prediction->properties->palette ?? []
                ];
            }
        }
    }
    
    return $colors;
}

function extractFaceDataCamelCase($analysis) {
    $face = [];
    
    if (isset($analysis->results->face->predictions)) {
        $face['predictions'] = convertSnakeToCamelRecursive($analysis->results->face->predictions);
    }
    
    // Include prediction count if available (camelCase key)
    if (isset($analysis->results->face->prediction_count)) {
        $face['predictionCount'] = $analysis->results->face->prediction_count;
    }
    
    return $face;
}

function convertSnakeToCamelRecursive($data) {
    if (is_array($data)) {
        $result = [];
        foreach ($data as $key => $value) {
            $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result[$camelKey] = convertSnakeToCamelRecursive($value);
        }
        return $result;
    } elseif (is_object($data)) {
        $result = new stdClass();
        foreach ($data as $key => $value) {
            $camelKey = lcfirst(str_replace('_', '', ucwords($key, '_')));
            $result->$camelKey = convertSnakeToCamelRecursive($value);
        }
        return $result;
    } else {
        return $data;
    }
}

function generateAnalysisHash($analysisData) {
    return hash('sha256', json_encode($analysisData));
}

try {
    $startTime = microtime(true);
    $timing = [];
    $timing['start'] = microtime(true);
    
    if (isset($_GET['url'])) {
        // Specific image by URL
        $imageUrl = $_GET['url'];
        $filename = extractFilenameFromUrl($imageUrl);
        
        if (!$filename) {
            throw new Exception('Invalid image URL format');
        }
        
        // Convert webp back to jpg for database lookup
        $dbFilename = convertToJpg($filename);
        
        $analysisData = getAnalysisFromSQLite($dbFilename);
        $timing['after_db'] = microtime(true);
        
        if (!$analysisData) {
            throw new Exception("Analysis not found for image: $filename");
        }
        
    } elseif (isset($_GET['filename'])) {
        // Specific image by filename
        $filename = $_GET['filename'];
        
        // Convert webp back to jpg for database lookup if needed
        $dbFilename = convertToJpg($filename);
        
        $analysisData = getAnalysisFromSQLite($dbFilename);
        $timing['after_db'] = microtime(true);
        
        if (!$analysisData) {
            throw new Exception("Analysis not found for image: $filename");
        }
        
        // Build the image URL
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://{$_SERVER['HTTP_HOST']}";
        $webpFilename = convertToWebp($analysisData->filename);
        $imageUrl = "{$baseUrl}/images/coco/{$webpFilename}";
        
    } elseif (isset($_GET['random']) || empty($_GET)) {
        // Random image (explicit random=true parameter or no parameters)
        $analysisData = getRandomImageFromSQLite();
        $timing['after_db'] = microtime(true);
        
        if (!$analysisData) {
            throw new Exception('No images available in database');
        }
        
        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://{$_SERVER['HTTP_HOST']}";
        $webpFilename = convertToWebp($analysisData->filename);
        $imageUrl = "{$baseUrl}/images/coco/{$webpFilename}";
    }
    
    $analysis = $analysisData->analysis;
    $timing['after_decode'] = microtime(true);
    $responseTime = microtime(true) - $startTime;
    
    // Extract nsfw data with camelCase keys
    $nsfwConfidence = $analysis->results->nsfw->predictions[0]->confidence ?? 0.0;
    $nsfwEmoji = $analysis->results->nsfw->predictions[0]->emoji ?? '';
    
    // Build unified image object format - NATIVE CAMELCASE THROUGHOUT
    $unifiedImageObject = [
        // Core image identification
        'filename' => $analysisData->filename ?? '',
        'imageId' => $analysisData->imageId ?? '',
        'encounterId' => uniqid('enc_', true), // NEW: Unique encounter identifier for this loading event
        'user' => '', // Frontend will populate this
        
        // Complete ML analysis data (populated from COCO database) - ALL CAMELCASE
        'analysisData' => [
            'processingTime' => $analysisData->analysisTime ?? 0,
            'responseTime' => $responseTime,
            'analysisHash' => generateAnalysisHash($analysis),
            'timestamp' => $analysisData->timestamp ?? '',
            'imageData' => [
                'imageDimensions' => [
                    'width' => $analysis->image_data->image_dimensions->width ?? -1,
                    'height' => $analysis->image_data->image_dimensions->height ?? -1
                ],
                'fileSize' => 0 // Not used according to format comments
            ],
            'emojiPredictions' => [
                'firstPlace' => convertSnakeToCamelRecursive($analysis->emoji_predictions->first_place ?? []),
                'secondPlace' => convertSnakeToCamelRecursive($analysis->emoji_predictions->second_place ?? [])
            ],
            'captions' => reconstructCaptionsCamelCase($analysis),
            'colors' => extractColorDataCamelCase($analysis),
            'face' => extractFaceDataCamelCase($analysis),
            'nsfw' => [
                'confidence' => $nsfwConfidence,
                'emoji' => $nsfwEmoji
            ]
        ],
        
        // Complete action history (starts empty, frontend populates)
        'actionHistory' => []
    ];
    
    $timing['after_build'] = microtime(true);
    
    // Log detailed timing breakdown
    $dbTime = round(($timing['after_db'] - $timing['start']) * 1000);
    $decodeTime = round(($timing['after_decode'] - $timing['after_db']) * 1000);
    $buildTime = round(($timing['after_build'] - $timing['after_decode']) * 1000);
    $totalTime = round($responseTime * 1000);
    
    $lookupType = isset($_GET['url']) ? "specific" : (isset($_GET['filename']) ? "specific" : "random");
    error_log("Image timing: DB={$dbTime}ms, Total={$totalTime}ms");
    
    // Output JSON directly - NO CAMELCASE CONVERSION NEEDED
    echo json_encode($unifiedImageObject);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Unified image lookup failed',
        'details' => $e->getMessage()
    ]);
}
?>