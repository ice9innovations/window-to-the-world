<?php

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "localhost:3001/?img=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "143.198.128.94/faces/?img=" . $_GET["img"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
