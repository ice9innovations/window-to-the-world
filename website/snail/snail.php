<?php

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "localhost:5000/?img=" . $_GET["img"]);
//curl_setopt($ch, CURLOPT_URL, "0.0.0.0:7777/?img=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "http://143.198.128.94/snail/?img=" . $_GET["img"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>