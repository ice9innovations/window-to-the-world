<?php

$user = $_GET['user'];

// create curl resource
$ch = curl_init();

// set url
$url = "http://178.62.236.25:8086/?user=" . $user;

curl_setopt($ch, CURLOPT_URL, $url);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

  // $output contains the output string
  $output = curl_exec($ch);
  echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
