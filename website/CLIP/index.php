<?php

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, "http://192.168.0.32:7880/?img=" . $_GET["img"]);
//curl_setopt($ch, CURLOPT_URL, "http://192.168.0.32:9000/?img=" . $_GET["img"]);
//curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:7778/?url=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "http://138.2.237.181/CLIP/?img=" . $_GET["img"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
