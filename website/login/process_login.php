<?PHP 
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

include("../inc/db.php");
include("../inc/security.php");
include("../inc/thumbnail.php");
include("../inc/analytics.php");

// Secure path validation function to prevent directory traversal attacks
function securePath($baseDir, $filename) {
    // Ensure base directory is absolute and normalized
    $baseDir = realpath($baseDir);
    if (!$baseDir) {
        throw new Exception("Invalid base directory");
    }
    
    // Check for path traversal attempts before sanitization
    if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
        throw new Exception("Path traversal attempt detected in filename");
    }
    
    // Create secure filename - basename() as additional protection
    $filename = basename($filename);
    $fullPath = $baseDir . DIRECTORY_SEPARATOR . $filename;
    
    // Verify final path is within base directory (defense in depth)
    $realFullPath = realpath(dirname($fullPath));
    if ($realFullPath === false || strpos($realFullPath, $baseDir) !== 0) {
        throw new Exception("Path traversal attempt detected in final path");
    }
    
    return $fullPath;
}

// Enhanced session security configuration (matching v3 session_check.php)
ini_set('session.gc_maxlifetime', 1440); // 24 minutes
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

session_start();

// Debug: Log that we're processing a login
error_log("DEBUG: process_login.php started - Query string: " . ($_SERVER['QUERY_STRING'] ?? 'empty'));
error_log("DEBUG: REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set'));

// Regenerate session ID periodically for security
if (!isset($_SESSION['created'])) {
    $_SESSION['created'] = time();
} else if (time() - $_SESSION['created'] > 1800) { // 30 minutes
    session_regenerate_id(true);
    $_SESSION['created'] = time();
}

// Rate limiting and input validation
$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit($client_ip, 5, 300)) {
    $redirect = "/login/?validate=rate_limited";
    header("Location: " . $redirect);
    exit();
}

// Sanitize input
$email_or_phone = isset($_POST["phone"]) ? base64_encode(strtolower(trim(sanitizeInput($_POST["phone"])))) : '';
//$phone = trim(preg_replace('/\D/', '', $_POST["phone"]));

$target_dir = "/var/www/html/login/uploads/";
$target_file = securePath($target_dir, uniqid() . ".tmp"); // Secure path validation

$err = "";
$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

$welcome_back = false;

$redirect = "";
$tn_data = "";
$uploadOk = 0; // Initialize upload flag
$tn_path = ""; // Initialize thumbnail path

// Debug output - TEMPORARY - Remove in production
/*
if(isset($_POST["login_submit"])) {
    echo "<pre>Debug Info:\n";
    echo "Form submitted at: " . date('Y-m-d H:i:s') . "\n";
    echo "Files array: " . print_r($_FILES, true) . "\n";
    echo "Upload errors: " . ($_FILES['pic']['error'] ?? 'No file') . "\n";
    echo "Target dir: " . $target_dir . "\n";
    echo "Target file: " . $target_file . "\n";
    echo "</pre>";
    // Uncomment to stop and see debug info:
    // exit();
}
*/

// Enhanced image validation
if(isset($_POST["login_submit"])) {
  // Check if file was uploaded without errors
  if (!isset($_FILES["pic"]) || $_FILES["pic"]["error"] !== UPLOAD_ERR_OK) {
    $redirect = "/login/?validate=upload_error";
    $uploadOk = 0;
  } else {
    // Validate file is actually an image
    $check = getimagesize($_FILES["pic"]["tmp_name"]);
    if($check !== false) {
      // Additional security: Check for image bombs
      if ($check[0] > 4096 || $check[1] > 4096) {
        $redirect = "/login/?validate=image_too_large";
        $uploadOk = 0;
      } else {
        $uploadOk = 1;
      }
    } else {
      $redirect = "/login/?validate=not_an_image";
      $uploadOk = 0;
    }
    
    // Enhanced file size and type validation
    if ($uploadOk == 1 && isset($_FILES["pic"]["size"]) && $_FILES["pic"]["size"] > 500000) {
      $redirect = "/login/?validate=too_large";
      $uploadOk = 0;
    }
    
    // Strict MIME type validation with whitelist
    $allowed_types = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "image/webp"
    ];
    
    if ($uploadOk == 1 && isset($check["mime"]) && !in_array($check["mime"], $allowed_types, true)) {
      $redirect = "/login/?validate=mime_type";
      $uploadOk = 0;
    }
    
    // Additional file extension validation
    if ($uploadOk == 1 && isset($_FILES["pic"]["name"])) {
      $file_extension = strtolower(pathinfo($_FILES["pic"]["name"], PATHINFO_EXTENSION));
      $allowed_extensions = ["jpg", "jpeg", "png", "gif", "webp"];
      
      if (!in_array($file_extension, $allowed_extensions, true)) {
        $redirect = "/login/?validate=invalid_extension";
        $uploadOk = 0;
      }
    }
  }
  
  // Check if $uploadOk is set to 0 by an error
  if (($uploadOk == 0) && (!($redirect))) {
    $err = "Sorry, your file was not uploaded.";
    $redirect = "/login/?validate=not_uploaded";

  // if everything is ok, try to upload file
  } else {
    //echo "<p>Attempting to move file from " . $_FILES["pic"]["tmp_name"] . " to " . $target_file . "</p>";
    
    if (move_uploaded_file($_FILES["pic"]["tmp_name"], $target_file)) {
      error_log("File uploaded successfully to: " . $target_file);
      //echo "<p>File moved successfully!</p>";
      //echo "The file ". htmlspecialchars( basename( $_FILES["pic"]["name"])). " has been uploaded to " . $target_file . "<br>";
      $hash = hash('sha256', file_get_contents($target_file));

      $tn_path = securePath("/var/www/html/login/tn/", uniqid() . ".jpg");
      // echo "<p>Creating thumbnail at: " . $tn_path . "</p>";
      
      try {
        $thumb = new Thumbnail($target_file);
        $thumb->createThumb($tn_path, 250);
        // echo "<p>Thumbnail created successfully!</p>";
      } catch (Exception $e) {
        //echo "<p>Thumbnail error: " . $e->getMessage() . "</p>";
        error_log("Thumbnail creation failed: " . $e->getMessage());
      }

      // echo $tn_path . "<br>";
      
      // Check if thumbnail was created successfully
      if (!file_exists($tn_path)) {
        //echo "<p>ERROR: Thumbnail file not created at: " . $tn_path . "</p>";
        $redirect = "/login/?validate=thumbnail_error";
      } else {
        //echo "<p>Thumbnail exists, size: " . filesize($tn_path) . " bytes</p>";
        $tn_data = urlencode(base64_encode(file_get_contents($tn_path)));
        
        // Store the web-accessible thumbnail path for ML processing
        // Convert from filesystem path to web path
        $_SESSION['login_thumbnail_url'] = str_replace('/var/www/html', '', $tn_path);
        
        // Store the full-sized login image for v3 interface
        $login_image_path = securePath("/var/www/html/login/uploads/", uniqid() . ".jpg");
        copy($target_file, $login_image_path);
        $_SESSION['login_image_url'] = str_replace('/var/www/html', '', $login_image_path);
        
        unlink($target_file);
      }

        //echo $email_or_phone . "<br>";

        //echo $_FILES["pic"]["tmp_name"] . "<br>";
        //echo $hash;

        // Create secure database connection
        $conn = getDBConnection();

        // Use prepared statement to prevent SQL injection
        // echo "<p>Looking up hash: " . $hash . "</p>";
        $sql = "SELECT userID, email, phone, hash FROM Users WHERE hash = ? AND active = true ORDER BY first_login LIMIT 1";
        $stmt = executeQuery($conn, $sql, "s", [$hash]);
        
        if (!$stmt) {
            $redirect = "/login/?validate=server_error";
            header("Location: " . $redirect);
            exit();
        }
        
        $result = $stmt->get_result();
        $activity_sql = "";

        if ($result) {
            //echo "<p>Query returned " . $result->num_rows . " rows</p>";

            $username = "";
            if ($result->num_rows > 0) {
              //echo "<p>User found! Processing login...</p>";
              // output data of each row
                $welcome_back = true;
                $userID = 0;

                while($row = $result->fetch_assoc()) {                
                    // Process login and redirect
                    if ($row["email"]) {
                        $username = $row["email"];
                        //$_SESSION["username"] = $row["email"];
                    } else {
                        if ($row["phone"]) {
                            $username = $row["phone"];
                            //$_SESSION["username"] = $row["phone"];
                        }
                    }

                    // ignore the previous and set the username
                    // to the image hash
                    $_SESSION["username"] = $row["hash"];
                    $_SESSION["userID"] = $row["userID"];
                    
                    // Debug session setting
                    error_log("LOGIN: Session ID: " . session_id() . " - Setting username: " . $row["hash"] . ", userID: " . $row["userID"]);
                    
                    // echo "<p>Session set! UserID: " . $row["userID"] . ", about to redirect...</p>";
                    
                    // Update last login timestamp
                    $update_login = executeQuery($conn, 
                        "UPDATE Users SET last_login = NOW(), last_ip_address = ?, last_user_agent = ? WHERE userID = ?",
                        "ssi",
                        [$_SERVER['REMOTE_ADDR'] ?? '', $_SERVER['HTTP_USER_AGENT'] ?? '', $row["userID"]]
                    );
                    if ($update_login) {
                        $update_login->close();
                    }
                    
                    // Log successful login for security audit
                    // TEMPORARILY DISABLED: logSecurityEvent('login_success', 'low', 'User logged in successfully', $row["userID"], [
                    //     'hash_used' => $row["hash"],
                    //     'welcome_back' => $welcome_back
                    // ]);
                    
                    // Start user session tracking
                    // TEMPORARILY DISABLED: $sessionID = startUserSession($row["userID"]);
                    // if ($sessionID) {
                    //     $_SESSION["sessionID"] = $sessionID;
                    // }
                    
                    // Log user behavior
                    // TEMPORARILY DISABLED: logUserBehavior($row["userID"], 'login', [
                    //     'login_method' => 'image_hash',
                    //     'returning_user' => $welcome_back
                    // ]);
                    
                    $redirect = "/v3/";

                    // Note: Activity table logging removed - using User_Behavior instead
                    // Thumbnail data stored in session for UI use
                    if (!empty($tn_data)) {
                        $_SESSION['login_thumbnail'] = $tn_data;
                    }
                }

            } else {
                // echo "<p>No existing user found - creating new account...</p>";
                // create an account with prepared statement
                $_SESSION["username"] = $hash;

                $create_stmt = executeQuery($conn, 
                    "INSERT INTO Users (hash, active, first_login, last_login, last_ip_address, last_user_agent) VALUES (?, ?, NOW(), NOW(), ?, ?)", 
                    "siss", 
                    [$hash, 1, $_SERVER['REMOTE_ADDR'] ?? '', $_SERVER['HTTP_USER_AGENT'] ?? '']
                );
                
                if ($create_stmt) {
                    $newUserID = $conn->insert_id;
                    $_SESSION["userID"] = $newUserID;
                    $create_stmt->close();
                    
                    // Log account creation for security audit
                    // TEMPORARILY DISABLED: logSecurityEvent('account_created', 'low', 'New user account created', $newUserID, [
                    //     'hash_used' => $hash,
                    //     'registration_method' => 'image_upload'
                    // ]);
                    
                    // Start user session tracking for new user
                    // TEMPORARILY DISABLED: $sessionID = startUserSession($newUserID);
                    // if ($sessionID) {
                    //     $_SESSION["sessionID"] = $sessionID;
                    // }
                    
                    // Log user behavior
                    // TEMPORARILY DISABLED: logUserBehavior($newUserID, 'login', [
                    //     'login_method' => 'image_hash',
                    //     'new_user' => true
                    // ]);
                    
                    // Store thumbnail data for new users too
                    if (!empty($tn_data)) {
                        $_SESSION['login_thumbnail'] = $tn_data;
                    }
                    
                    // Store the web-accessible thumbnail URL for ML processing
                    if (!empty($_SESSION['login_thumbnail_url'])) {
                        // Already set above, just making sure it's available for new users
                    }
                    
                    $redirect = "/v3/";
                } else {
                    // Log failed account creation
                    // TEMPORARILY DISABLED: logSecurityEvent('account_creation_failed', 'medium', 'Failed to create new user account', null, [
                    //     'hash_attempted' => $hash,
                    //     'error' => 'Database insertion failed'
                    // ]);
                    $redirect = "/login/?validate=server_error";
                }
            }
        } else {
            $redirect = "/login/?validate=server_error";
        }

        // Close prepared statement and database connection
        if (isset($stmt)) {
            $stmt->close();
        }
        $conn->close();
        

    } else {
        $err = "Sorry, there was an error uploading your file.";
        error_log("Failed to move uploaded file. Upload error: " . $_FILES["pic"]["error"]);
        error_log("Target path: " . $target_file);
        //echo $err;
        $redirect = "/login/?validate=upload_error";
    }
  }
} // End of if(isset($_POST["login_submit"]))

  // Database connection already closed above

  // set welcome back flag
  if ($redirect) {
    // Debug logging for redirect path
    error_log("DEBUG: Taking redirect path with redirect = " . $redirect);
    error_log("DEBUG: Query string in redirect path: " . ($_SERVER['QUERY_STRING'] ?? 'empty'));

    if ($tn_path) {
        $tn_path = str_replace("/var/www/html/login/tn/", "", $tn_path);

        if (strpos($redirect, "/login/") != false) {
            $repl = "/login/?tn=" . $tn_path;
            $redirect = str_replace("/login/?", $repl, $redirect);
            $redirect .= "&ret=" . $welcome_back;
        }
        if ($redirect == "/") {
            $redirect = "/?tn=" . $tn_path;
            $redirect .= "&ret=" . $welcome_back;
            error_log("DEBUG: Modified redirect to include thumbnail: " . $redirect);
        }
    }
    
    // Preserve query string for shared links in redirect path too
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    if (!empty($queryString) && !strpos($redirect, '?')) {
        $redirect .= '?' . $queryString;
        error_log("DEBUG: Added query string to redirect: " . $redirect);
    }
    
    error_log("DEBUG: Final redirect URL: " . $redirect);
    // Debug output (comment out in production)
    // echo "<p>About to redirect to: " . $redirect . "</p>";
    // echo "<p><a href='" . $redirect . "'>Click here if not redirected</a></p>";
    header("Location: " . $redirect);
  } else {
    // Check if shared link parameters were preserved from original URL
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    $v3Url = '/v3/';
    
    // Debug logging
    error_log("DEBUG: Query string from SERVER: " . $queryString);
    error_log("DEBUG: REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set'));
    
    if (!empty($queryString)) {
        $v3Url .= '?' . $queryString;
        error_log("Login success: Redirecting to shared link with parameters: " . $queryString);
    } else {
        error_log("Login success: No query string found, redirecting to plain /v3/");
    }
    
    // Debug output (comment out in production)
    // echo "<p>No redirect set, going to homepage</p>";
    // echo "<p><a href='/'>Click here if not redirected</a></p>";
    header("Location: " . $v3Url);
  }

?>
