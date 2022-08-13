<?php

$user = $_GET['user'];
$color = $_GET['color'];

// create curl resource
$ch = curl_init();

// set url
curl_setopt($ch, CURLOPT_URL, "localhost:8089/?user=" . $user . "&color=" . $color);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

  // $output contains the output string
  $output = curl_exec($ch);
  echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
