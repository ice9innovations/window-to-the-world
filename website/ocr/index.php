<?php

include ("../inc/config.php");

// create curl resource
$ch = curl_init();

// set url
//curl_setopt($ch, CURLOPT_URL, $ML_SERVICES. "/object/object.php?img=" . $_GET["img"]);
curl_setopt($ch, CURLOPT_URL, "http://meringue.local:7777/?url=" . $_GET["img"]);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

// $output contains the output string
$output = curl_exec($ch);

//header('Content-Type: application/json; charset=utf-8');
echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
