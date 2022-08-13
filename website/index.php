<?php
// Begin the PHP session so we have a place to store the username
session_start();

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

//echo "AUTH: " . $_SESSION["username"]

// handle logout first
if (isset($_REQUEST['logout'])) {
    unset($_SESSION['username']);
    header('Location: /');
    die();
}

// If there is a username, they are logged in, and we'll show the logged-in view
if(isset($_SESSION['username'])) {

    echo "<script>\r\n  var session = {}\r\n";
    echo "  session.email = \"" . $_SESSION['username'] . "\"\r\n";
    echo "  session.name = \"" . sha1($_SESSION['username']) . "\"\r\n";
    echo "</script>\r\n";

    include("main.php");
    
    die();
  }


// If there is no username, they are logged out, so show them the login link
if(!isset($_SESSION['username'])) {
    // Generate a random state parameter for CSRF security    
    // include("public.php");
    header("Location: /login");
}

?>