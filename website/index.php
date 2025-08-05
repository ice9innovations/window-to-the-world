<?php
// Enhanced session security configuration
ini_set('session.gc_maxlifetime', 1440); // 24 minutes
ini_set('session.cookie_httponly', 1); // Prevent XSS access to session cookie
ini_set('session.cookie_secure', 0); // Set to 1 for HTTPS only
ini_set('session.use_strict_mode', 1); // Prevent session fixation
ini_set('session.cookie_samesite', 'Strict'); // CSRF protection

// Begin the PHP session so we have a place to store the username
session_start();

// Regenerate session ID periodically for security
if (!isset($_SESSION['created'])) {
    $_SESSION['created'] = time();
} else if (time() - $_SESSION['created'] > 1800) { // 30 minutes
    session_regenerate_id(true);
    $_SESSION['created'] = time();
}

// Disable error display in production - security risk
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

//echo "AUTH: " . $_SESSION["username"]

// handle logout first
if (isset($_REQUEST['logout'])) {
    unset($_SESSION['username']);
    header('Location: /logout');
    die();
}

// If there is a username, they are logged in, and we'll show the logged-in view
if(isset($_SESSION['username'])) {
    header('Location: /v3');
}


// If there is no username, they are logged out, so show them the login link
if(!isset($_SESSION['username'])) {
    // Generate a random state parameter for CSRF security    
    // include("public.php");
    header("Location: /login");
}

?>
