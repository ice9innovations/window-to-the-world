<?php

$img = $_GET["img"];

$ip = $_SERVER['SERVER_ADDR'];

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "localhost:4000/?img=" . $_GET["img"]);
//curl_setopt($ch, CURLOPT_URL, "http://35.192.189.161:7777/?img=" . $_GET["img"]);
//curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:7780/?url=" . $img . "&ip=" . $ip);
curl_setopt($ch, CURLOPT_URL, "http://138.2.237.181/metadata/?img=" . $img . "&ip=" . $ip);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
