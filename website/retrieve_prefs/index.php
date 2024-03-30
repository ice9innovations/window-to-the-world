<?php

$user = $_GET['user'];
$emoji = $_GET['emoji'];
$history = $_GET['hisotry'];

// create curl resource
$ch = curl_init();

// set url
curl_setopt($ch, CURLOPT_URL, "localhost:8085/?user=" . $user . "&history=" . $history . "&emoji=" . $emoji);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

  // $output contains the output string
  $output = curl_exec($ch);
  echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
