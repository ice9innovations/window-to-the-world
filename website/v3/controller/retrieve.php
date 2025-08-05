<?php
// Animal Farm v2 - Retrieve Endpoint

require_once __DIR__ . '/common.php';

$username = $_GET['username'] ?? null;
$afterEncounter = $_GET['after_encounter'] ?? null; // Get image viewed before this encounter ID
$before = $_GET['before'] ?? null; // Get image viewed before this timestamp
$afterId = $_GET['after_id'] ?? null; // Get image viewed before this database ID (recommended)
$consume = $_GET['consume'] ?? null; // Delete the retrieved records (for backward buffer)

if (!$username) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required parameter: username'
    ]);
    exit();
}

try {
    $pdo = connectUserInteractions();
    if (!$pdo) {
        throw new Exception('Failed to connect to user interactions database');
    }
    
    // Start transaction if consume mode is enabled
    if ($consume) {
        $pdo->beginTransaction();
    }
    
    // Query the user_images table (MySQL) - username-based access only
    
        if ($afterId !== null) {
            // Historical navigation: get one image viewed before the specified database ID (recommended method)
            $stmt = $pdo->prepare("
                SELECT id, data, created_on FROM user_images 
                WHERE user_id = ? 
                AND consumed = 0
                AND id < ?
                ORDER BY id DESC 
                LIMIT 1");
            $stmt->execute([$username, intval($afterId)]);
        } else if ($before !== null) {
            // Historical navigation: get one image viewed before the specified timestamp (legacy method)
            // Convert Unix timestamp (milliseconds) to MySQL DATETIME format
            $beforeDateTime = date('Y-m-d H:i:s', $before / 1000);
            $stmt = $pdo->prepare("
                SELECT id, data, created_on FROM user_images 
                WHERE user_id = ? 
                AND consumed = 0
                AND created_on < ?
                ORDER BY created_on DESC 
                LIMIT 1");
            $stmt->execute([$username, $beforeDateTime]);
        } else if ($afterEncounter !== null) {
            // Historical navigation: get one image viewed before the specified encounter ID (legacy support)
            if ($afterEncounter) {
                // Get image viewed before the specified encounter ID
                $stmt = $pdo->prepare("
                    SELECT id, data, created_on FROM user_images 
                    WHERE user_id = ? 
                    AND consumed = 0
                    AND created_on < (SELECT created_on FROM user_images WHERE encounter_id = ? AND user_id = ?)
                    ORDER BY created_on DESC 
                    LIMIT 1");
                $stmt->execute([$username, $afterEncounter, $username]);
            } else {
                // Get most recent image (afterEncounter is blank/empty)
                $stmt = $pdo->prepare("
                    SELECT id, data, created_on FROM user_images 
                    WHERE user_id = ? 
                    AND consumed = 0
                    ORDER BY created_on DESC 
                    LIMIT 1");
                $stmt->execute([$username]);
            }
        } else {
            // Normal loading: all images for user (or most recent if no parameters)
            $stmt = $pdo->prepare('
                SELECT id, data, created_on FROM user_images 
                WHERE user_id = ? 
                AND consumed = 0
                ORDER BY created_on DESC
                LIMIT 1
            ');
            $stmt->execute([$username]);
        }
    
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Soft delete the retrieved records if consume mode is enabled
    if ($consume && count($rows) > 0) {
        $recordIds = array_column($rows, 'id');
        $placeholders = str_repeat('?,', count($recordIds) - 1) . '?';
        $updateStmt = $pdo->prepare("UPDATE user_images SET consumed = 1 WHERE id IN ($placeholders)");
        $updateStmt->execute($recordIds);
    }
    
    // Deserialize JSON blobs back to unified image objects
    $unified_objects = [];
    foreach ($rows as $row) {
        try {
            $unified_object = json_decode($row['data'], true);
            if ($unified_object && is_array($unified_object)) {
                // Add database ID and timestamp for pagination
                $unified_object['databaseId'] = $row['id'];
                $unified_object['databaseTimestamp'] = $row['created_on'];
                $unified_objects[] = $unified_object;
            }
        } catch (Exception $e) {
            error_log("Retrieve.php: Failed to decode JSON for record " . $row['id'] . ": " . $e->getMessage());
            // Continue processing other records
        }
    }
    
    // Commit transaction if consume mode was used
    if ($consume) {
        $pdo->commit();
    }
    
    echo json_encode([
        'success' => true,
        'username' => $username,
        'imageCount' => count($unified_objects),
        'images' => $unified_objects,
        'consumed' => $consume ? count($rows) : 0
    ]);
    
} catch (Exception $e) {
    // Robust rollback with error handling
    if ($consume) {
        try {
            if ($pdo && $pdo->inTransaction()) {
                $pdo->rollback();
                error_log("retrieve.php: Transaction rolled back due to error: " . $e->getMessage());
            }
        } catch (PDOException $rollbackException) {
            // Critical: Rollback failed
            error_log("CRITICAL: Transaction rollback failed in retrieve.php: " . $rollbackException->getMessage());
            error_log("Original error: " . $e->getMessage());
            
            // Consider additional recovery measures:
            // - Alert administrators
            // - Mark database as potentially inconsistent
            // - Attempt connection reset
        }
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Retrieval failed',
        'details' => $e->getMessage()
    ]);
}
?>