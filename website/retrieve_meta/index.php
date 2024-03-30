<?php

$user = $_GET['user'];
$emoji = $_GET['emoji'];
$filename = $_GET['file'];

// build url parts manually

$url_parts['filesize'] = $_GET['filesize'];
$url_parts['format'] = $_GET['format'];
$url_parts['dpi'] = $_GET['dpi'];
$url_parts['width'] = $_GET['width'];
$url_parts['height'] = $_GET['height'];
$url_parts['megapixels'] = $_GET['megapixels'];
$url_parts['quality'] = $_GET['quality'];
$url_parts['alpha'] = $_GET['alpha'];
$url_parts['channels'] = $_GET['channels'];
$url_parts['space'] = $_GET['space'];
$url_parts['progressive'] = $_GET['progressive'];
$url_parts['complexity'] = $_GET['complexity'];
$url_parts['display_mode'] = $_GET['display_mode'];
$url_parts['shannon'] = $_GET['shannon'];
$url_parts['min_filesize'] = $_GET['min_filesize'];
$url_parts['inforomation'] = $_GET['information'];
$url_parts['entropy'] = $_GET['entropy'];

$url_add = "";
foreach($url_parts as $key => $val) {
  $url_add .= "&" . $key . "=" . $val;
}

// create curl resource
$ch = curl_init();

// set url
$url = "localhost:8085/?user=" . $user . "&file=" . $filename . "&emoji=" . $emoji . $url_add;

curl_setopt($ch, CURLOPT_URL, $url);

//return the transfer as a string
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

  // $output contains the output string
  $output = curl_exec($ch);
  echo $output;

// close curl resource to free up system resources
curl_close($ch);
?>
