<?php

$q = $_GET["q"];

// create curl resource
$ch = curl_init();

// set url
curl_setopt($ch, CURLOPT_URL, "198.199.97.163/public_domain/?q=" . $q); // ad server

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
