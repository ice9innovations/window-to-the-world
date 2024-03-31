<?php

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "http://192.168.0.32:7880/?img=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "http://localhost:9400/?num=" . $_GET["num"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
