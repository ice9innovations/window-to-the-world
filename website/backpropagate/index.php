<?php

$user = $_GET["user"];
$emoji = $_GET["emoji"];
$valence = $_GET["valence"];

// create curl resource
$ch = curl_init();

// set url
curl_setopt($ch, CURLOPT_URL, "localhost:8888/public_domain/?user=" . $user . "&emoji=" . $emoji . "&valence=" . $valence); // ad server

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
