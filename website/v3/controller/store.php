<?php
// Animal Farm v2 - Store User Interaction Endpoint

require_once __DIR__ . '/common.php';

function storeUnifiedImageObject($unifiedImageObject, $username, $sessionId) {
    $pdo = connectUserInteractions();
    if (!$pdo) {
        error_log("Failed to connect to user interactions database");
        return false;
    }
    
    $maxRetries = 3;
    $retryDelay = 100; // milliseconds
    
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        try {
            $imageId = $unifiedImageObject['imageId'] ?? $unifiedImageObject['filename'] ?? 'unknown';
            $encounterId = $unifiedImageObject['encounterId'] ?? null;
            $filename = $unifiedImageObject['filename'] ?? 'unknown';
            
            if (!$encounterId) {
                throw new Exception("Missing encounter ID for unified image object");
            }
            
            error_log("storeUnifiedImageObject: Attempt $attempt for encounter: $encounterId (image: $filename)");
            
            // Start transaction for atomic DELETE+INSERT
            $pdo->beginTransaction();
            
            // Check if we should update existing record based on latest action timestamp
            $shouldUpdate = true;
            $newActionHistory = $unifiedImageObject['actionHistory'] ?? [];
            
            if (!empty($newActionHistory)) {
                // Get the most recent action timestamp from new data
                $newLatestTimestamp = '';
                foreach ($newActionHistory as $action) {
                    if (isset($action['timestamp']) && $action['timestamp'] > $newLatestTimestamp) {
                        $newLatestTimestamp = $action['timestamp'];
                    }
                }
                
                // Check if existing record has more recent actions
                $checkStmt = $pdo->prepare('
                    SELECT data FROM user_images 
                    WHERE user_id = ? AND session_id = ? AND encounter_id = ?
                ');
                $checkStmt->execute([$username, $sessionId, $encounterId]);
                $existingRow = $checkStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingRow) {
                    $existingData = json_decode($existingRow['data'], true);
                    $existingActionHistory = $existingData['actionHistory'] ?? [];
                    
                    if (!empty($existingActionHistory)) {
                        $existingLatestTimestamp = '';
                        foreach ($existingActionHistory as $action) {
                            if (isset($action['timestamp']) && $action['timestamp'] > $existingLatestTimestamp) {
                                $existingLatestTimestamp = $action['timestamp'];
                            }
                        }
                        
                        // Only update if our latest action is newer or equal
                        $shouldUpdate = ($newLatestTimestamp >= $existingLatestTimestamp);
                        
                        if (!$shouldUpdate) {
                            error_log("storeUnifiedImageObject: Skipping update for $filename - existing data has newer actions ($existingLatestTimestamp vs $newLatestTimestamp)");
                        }
                    }
                }
            }
            
            if ($shouldUpdate) {
                // Delete any existing record for this user/session/encounter (deduplication)
                $deleteStmt = $pdo->prepare('
                    DELETE FROM user_images 
                    WHERE user_id = ? AND session_id = ? AND encounter_id = ?
                ');
                $deleteStmt->execute([$username, $sessionId, $encounterId]);
                
                // Insert the unified image object with duplicate key handling
                $insertStmt = $pdo->prepare('
                    INSERT INTO user_images (user_id, session_id, filename, encounter_id, data, consumed)
                    VALUES (?, ?, ?, ?, ?, 0)
                    ON DUPLICATE KEY UPDATE 
                        data = VALUES(data),
                        consumed = 0,
                        updated = NOW()
                ');
                
                $jsonData = json_encode($unifiedImageObject);
                $insertStmt->execute([$username, $sessionId, $filename, $encounterId, $jsonData]);
            }
            
            // Commit transaction
            $pdo->commit();
            
            error_log("storeUnifiedImageObject: Successfully stored unified object for $filename on attempt $attempt");
            return true;
            
        } catch (Exception $e) {
            // Check for unique constraint violation on encounter_id
            if ($e instanceof PDOException && $e->getCode() == '23000') {
                // MySQL error 1062: Duplicate entry for unique key
                if (strpos($e->getMessage(), 'unique_encounter_id') !== false) {
                    error_log("INFO: Duplicate encounter ID - data already stored");
                    error_log("Encounter ID: $encounterId, Filename: $filename, User: $username");
                    // This is normal during navigation - same image with same encounter ID
                    // Data is already in database, so this is effectively a success
                    return true;
                }
            }
            
            // Robust rollback with error handling for other errors
            try {
                if ($pdo && $pdo->inTransaction()) {
                    $pdo->rollback();
                    error_log("storeUnifiedImageObject: Transaction rolled back due to error: " . $e->getMessage());
                }
            } catch (PDOException $rollbackException) {
                // Critical: Rollback failed
                error_log("CRITICAL: Transaction rollback failed in store.php: " . $rollbackException->getMessage());
                error_log("Original error: " . $e->getMessage());
                
                // Consider additional recovery measures:
                // - Alert administrators
                // - Mark database as potentially inconsistent
                // - Attempt connection reset
            }
            
            error_log("storeUnifiedImageObject: Attempt $attempt failed for $filename: " . $e->getMessage());
            
            // If this was the last attempt, give up
            if ($attempt === $maxRetries) {
                error_log("storeUnifiedImageObject: All $maxRetries attempts failed for $filename");
                return false;
            }
            
            // Wait before retrying
            usleep($retryDelay * 1000); // Convert to microseconds
            $retryDelay *= 2; // Exponential backoff
        }
    }
    
    return false;
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed',
        'details' => 'This endpoint requires POST method'
    ]);
    exit();
}

try {
    $input = file_get_contents('php://input');
    $requestData = json_decode($input, true);
    
    if (!$requestData) {
        error_log("Store.php: Invalid JSON data received: " . substr($input, 0, 200));
        throw new Exception('Invalid JSON data');
    }
    
    // Extract unified image object and user info from request
    $unifiedImageObject = $requestData['unifiedImageObject'] ?? null;
    $username = $requestData['username'] ?? '';
    $sessionId = $requestData['sessionId'] ?? '';
    
    if (!$unifiedImageObject) {
        throw new Exception('Missing unified image object');
    }
    
    $filename = $unifiedImageObject['filename'] ?? 'unknown';
    error_log("Store.php: Processing unified image object for: $filename");
    error_log("Store.php: Keys in unifiedImageObject: " . implode(', ', array_keys($unifiedImageObject)));
    error_log("Store.php: encounterId value: " . ($unifiedImageObject['encounterId'] ?? 'MISSING'));
    
    $result = storeUnifiedImageObject($unifiedImageObject, $username, $sessionId);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'User interaction stored successfully'
        ]);
    } else {
        throw new Exception('Failed to store interaction');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Storage failed',
        'details' => $e->getMessage()
    ]);
}
?>