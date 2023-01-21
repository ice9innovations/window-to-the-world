<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "localhost:3000/?img=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "http://192.168.0.32:9600/?img=" . $_GET["img"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);
echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
