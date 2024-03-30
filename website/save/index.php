<?php

$img = $_POST['img'];
$post = $img;
$post = $img;

// create curl resource
$ch = curl_init();

// set url
curl_setopt($ch, CURLOPT_URL, "http://178.62.236.25:8088/");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, "img=" . $post);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

  // $output contains the output string
  $output = curl_exec($ch);
  echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
