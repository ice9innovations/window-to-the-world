<?PHP
session_start();

unset($_SESSION['username']);
header('Location: /login');

?>