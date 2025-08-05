# Animal Farm v3 Controller Architecture

## Overview

The Animal Farm v3 controller system follows a **clean, individual endpoint pattern** with shared common functionality. Each endpoint is a standalone PHP file that handles a specific API operation, with common functionality abstracted into `common.php`.

## Architecture Principles

### 1. Individual Endpoint Pattern
- **One file per endpoint**: Each API operation has its own PHP file
- **Self-contained logic**: Endpoint-specific functions live in their respective files
- **Consistent structure**: All endpoints follow the same organizational pattern
- **Clear separation**: No monolithic routing or complex dispatching

### 2. Shared Common Functions
- **Database connections**: Connection management for SQLite and MySQL
- **Utility functions**: CamelCase conversion, input validation
- **HTTP headers**: CORS, content-type, and response formatting
- **Error handling**: Consistent error response patterns

### 3. Automatic Data Transformation
- **CamelCase output**: All JSON responses automatically converted to camelCase
- **Transparent processing**: Developers write snake_case, API returns camelCase
- **No manual conversion**: Output buffering handles transformation automatically

## File Structure

```
/controller/
├── common.php          # Shared functions and configuration
├── health.php          # System health check endpoint
├── image.php           # Random image selection and ML data
├── store.php           # User interaction storage
├── retrieve.php        # Historical data retrieval
├── session_state.php   # Session management
├── reset-consumed.php  # Database maintenance
└── controller.php      # Legacy controller (being phased out)
```

## URL Routing

Clean URLs are handled by `.htaccess` rewrite rules:
- `/v3/health` → `/v3/controller/health.php`
- `/v3/image` → `/v3/controller/image.php`
- `/v3/store` → `/v3/controller/store.php`

## Common.php Architecture

### Automatic Features (Applied to All Endpoints)

1. **HTTP Headers**
   ```php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: *');
   header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
   ```

2. **OPTIONS Request Handling**
   ```php
   if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
       exit(0);
   }
   ```

3. **Automatic CamelCase Conversion**
   ```php
   // Output buffering captures all JSON responses
   // Automatically converts snake_case → camelCase
   register_shutdown_function(function() {
       // Transform all JSON output to camelCase
   });
   ```

### Shared Functions

#### Database Connections
```php
connectSQLite()           # Read-only ML analysis data
connectUserInteractions() # User interaction storage (MySQL)
```

#### Utility Functions
```php
toCamelCase($data)        # Recursive snake_case → camelCase conversion
```

## Endpoint Architecture Pattern

### Standard Endpoint Structure

Every endpoint follows this pattern:

```php
<?php
// 1. Include common functionality
require_once __DIR__ . '/common.php';

// 2. Define endpoint-specific functions
function endpointSpecificFunction() {
    // Endpoint logic here
}

// 3. HTTP method validation (if required)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// 4. Main endpoint logic with error handling
try {
    // Process request
    $result = processRequest();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Operation failed',
        'details' => $e->getMessage()
    ]);
}
?>
```

### Example: Health Check Endpoint

```php
<?php
// /controller/health.php
require_once __DIR__ . '/common.php';

$health = [
    'status' => 'healthy',
    'timestamp' => date('c'),
    'mode' => 'php_sqlite_mysql'
];

try {
    // Test database connections
    $sqlite = connectSQLite();
    $mysql = connectUserInteractions();
    
    $health['sqlite_status'] = $sqlite ? 'connected' : 'failed';
    $health['mysql_status'] = $mysql ? 'connected' : 'failed';
    
    if (!$sqlite || !$mysql) {
        $health['status'] = 'degraded';
        http_response_code(503);
    }
    
    echo json_encode($health);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage()
    ]);
}
?>
```

## Adding New Endpoints

### Step 1: Create Endpoint File

Create `/controller/your-endpoint.php`:

```php
<?php
// Animal Farm v3 - Your Endpoint Description
require_once __DIR__ . '/common.php';

// Endpoint-specific functions go here
function processYourEndpoint($data) {
    // Your logic here
    return $result;
}

// HTTP method validation if needed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    exit();
}

try {
    // Process request
    $input = file_get_contents('php://input');
    $requestData = json_decode($input, true);
    
    if (!$requestData) {
        throw new Exception('Invalid JSON data');
    }
    
    $result = processYourEndpoint($requestData);
    
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Processing failed',
        'details' => $e->getMessage()
    ]);
}
?>
```

### Step 2: URL Access

The endpoint will be automatically accessible at:
- `/v3/your-endpoint` (clean URL via .htaccess)
- `/v3/controller/your-endpoint.php` (direct access)

### Step 3: Add Tests

Add tests to the appropriate test file:

```php
private function testYourEndpoint() {
    $response = $this->makeRequest('/your-endpoint', 'POST', $testData);
    
    $this->assert(
        $response['http_code'] === 200,
        'Your endpoint returns 200 status'
    );
    
    $data = json_decode($response['body'], true);
    $this->assert(
        $data['success'] === true,
        'Your endpoint indicates success'
    );
}
```

## Function Organization Guidelines

### When to Use common.php

**Add functions to common.php when:**
- Used by 2+ different endpoints
- Database connection management
- Utility functions (formatting, validation)
- Cross-cutting concerns (logging, security)

**Examples of common.php functions:**
```php
connectSQLite()           # Used by image.php, health.php
connectUserInteractions() # Used by store.php, retrieve.php, health.php
toCamelCase()            # Used by automatic output conversion
```

### When to Use Endpoint Files

**Keep functions in endpoint files when:**
- Only used by that specific endpoint
- Business logic specific to one operation
- Complex processing unique to the endpoint

**Examples of endpoint-specific functions:**
```php
// In image.php
getRandomImageFromSQLite()    # Only used for random image selection
extractColorData()            # Only used for image data processing

// In store.php  
storeUnifiedImageObject()     # Only used for user interaction storage
```

## Data Structure Patterns

### Request Format
```json
{
  "snake_case_field": "value",
  "nested_object": {
    "another_field": "value"
  }
}
```

### Response Format (Automatically Converted to CamelCase)
```json
{
  "success": true,
  "data": {
    "camelCaseField": "value",
    "nestedObject": {
      "anotherField": "value"
    }
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Brief error description",
  "details": "Detailed error message for debugging"
}
```

## Database Architecture

### Two-Database System
- **SQLite** (`/var/www/db/animal_farm.db`): Read-only ML analysis data (118K+ records)
- **MySQL** (`animal_farm_v3` database): User interactions and session data

### Connection Usage
```php
// For ML analysis data (read-only)
$sqlite = connectSQLite();
$stmt = $sqlite->prepare("SELECT * FROM images WHERE filename = ?");

// For user interactions (read/write)
$mysql = connectUserInteractions(); 
$stmt = $mysql->prepare("INSERT INTO user_images (user_id, data) VALUES (?, ?)");
```

## Testing Patterns

### Integration Tests
Located in `/tests/EndpointIntegrationTest.php`:

```php
private function testYourEndpoint() {
    // Test happy path
    $response = $this->makeRequest('/your-endpoint', 'POST', $validData);
    $this->assert($response['http_code'] === 200, 'Endpoint returns 200');
    
    // Test error handling
    $response = $this->makeRequest('/your-endpoint', 'POST', $invalidData);
    $this->assert($response['http_code'] === 400, 'Endpoint validates input');
    
    // Test response structure
    $data = json_decode($response['body'], true);
    $this->assert(isset($data['success']), 'Response includes success field');
}
```

### Running Tests
```bash
cd /home/sd/animal-farm/v3/tests
php TestRunner.php
```

## Security Considerations

### Input Validation
```php
// Always validate JSON input
$input = file_get_contents('php://input');
$requestData = json_decode($input, true);

if (!$requestData) {
    throw new Exception('Invalid JSON data');
}

// Validate required fields
if (!isset($requestData['required_field'])) {
    throw new Exception('Missing required field');
}
```

### Database Security
```php
// Always use prepared statements
$stmt = $pdo->prepare("SELECT * FROM table WHERE id = ?");
$stmt->execute([$userId]);

// Never concatenate user input into queries
// BAD: "SELECT * FROM table WHERE id = " . $userId
```

### Error Handling
```php
try {
    // Risky operation
    $result = performOperation();
    
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    // Log detailed error for debugging
    error_log("Operation failed: " . $e->getMessage());
    
    // Return generic error to client
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Operation failed',
        'details' => $e->getMessage() // Only in development
    ]);
}
```

## Best Practices

### 1. Keep It Simple
- One endpoint = one PHP file
- Clear, descriptive function names
- Minimal dependencies between endpoints

### 2. Consistent Error Handling
- Always use try/catch blocks
- Return structured error responses
- Log errors for debugging

### 3. Database Best Practices
- Use appropriate database for the data type
- Always use prepared statements
- Handle connection failures gracefully

### 4. Follow Existing Patterns
- Look at existing endpoints as examples
- Use the same response structure
- Follow the same error handling patterns

### 5. Test Everything
- Add integration tests for new endpoints
- Test happy path and error conditions
- Verify response structure and HTTP codes

## Migration Notes

### From controller.php (Legacy)
The old `controller.php` used a monolithic switch statement:
```php
// OLD PATTERN (being phased out)
switch ($_GET['action']) {
    case 'store':
        handleStore();
        break;
    case 'retrieve':
        handleRetrieve();
        break;
}
```

### To Individual Endpoints (Current)
```php
// NEW PATTERN (current architecture)
// /controller/store.php - handles store operations only
// /controller/retrieve.php - handles retrieve operations only
```

This change provides:
- Better code organization
- Easier testing and debugging
- Clear separation of concerns
- Simpler deployment and maintenance

---

*This documentation reflects the clean architecture established after the controller refactoring work completed in August 2025.*
