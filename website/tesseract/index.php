<?php

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "http://192.168.0.14:9001/?img=" . $_GET["img"]);
//curl_setopt($ch, CURLOPT_URL, "http://192.9.154.176/yolo/?img=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:7775/?url=" . $_GET["img"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
