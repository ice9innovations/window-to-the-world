<?PHP
include("../../inc/sendgrid/sendgrid-php.php"); // If you're using Composer (recommended)
include("../../inc/db.php");

// why are these different?
require '../../inc/twilio/twilio-php-main/src/Twilio/autoload.php';
require '../../inc/secret.php';

//echo "File:<br>";
//echo $_FILES["pic"]["tmp_name"];

$hash = sha1(file_get_contents($_FILES["pic"]["tmp_name"]));
//echo "<br>Hash: " . $hash . "<br>";

use Twilio\Rest\Client;

// Start the session
session_start();

$uploadOk = 1;

$reset = $_GET["reset"];
$name = trim($_POST["name"]);
$email = strtolower(trim($_POST["email"]));
$phone = trim(preg_replace('/\D/', '', $_POST["phone"]));
$redirect = "";
$valid = true;

if ($reset) {
    if ($reset == "complete") {
        $valid = false;
    } else {
        // is it a reset code?
        $current_time = time();

        // strip all but numbers;
        $num = preg_replace('/[^0-9]/', '', $reset);

        $diff = ($current_time - $num) / 60;
        // echo "<br>Minutes since link was sent: " . $diff;

        if ($diff >= 15) {
            $valid = false;
        }
    }
}

if (!($valid)) {
    // link is expired
    $redirect = "/reset/new/?validate=expired";
} else {
    // process reset request

    if ((!($name)) || ((!($email)) && (!($phone)))) {
        $msg = "missing";
        if (!($name)) { $msg .= "_name"; }
        if (!($email)) { $msg .= "_email"; }
        if (!($phone)) { $msg .= "_phone"; }
        
        $redirect = "/reset/new/?validate=" . $msg;
    }
    
    // echo "Name: " . $name . "<br>";
    // echo "Email: " . $email . "<br>";
    // echo "Phone: " . $phone . "<br>";
    
    if (!($name)) { $uploadOk = 0; }
    if ((!($email)) && (!($phone))) { $uploadOk = 0; }
    
    $target_dir = "./uploads/";
    $target_file = $target_dir . uniqid(); // basename($_FILES["pic"]["name"]);
        
    $imageFileType = strtolower(pathinfo($_FILES["pic"]["tmp_name"],PATHINFO_EXTENSION));
    
    // Check if image file is a actual image or fake image
    if(isset($_POST["submit"])) {
      $check = getimagesize($_FILES["pic"]["tmp_name"]);
      if($check !== false) {
        //echo "File is an image - " . $check["mime"] . ".";
        $uploadOk = 1;
      } else {
        //echo "File is not an image.";
        $uploadOk = 0;
        $redirect = "/reset/new/?validate=not_an_image";
      }
    }
    
    // Check if file already exists
    if (file_exists($target_file)) {
        //echo "Sorry, file already exists.";
        //$uploadOk = 0;
    }
      
      // Check file size
      if ($_FILES["pic"]["size"] > 1000000) {
        //echo "Sorry, your file is too large.";
        $redirect = "/reset/new/?validate=too_large";
    
        $uploadOk = 0;
      }
      
      // Allow certain file formats
      // echo "MIME TYPE: " . $check["mime"] . "<br>";
    
      if ($check["mime"] != "image/jpeg" && $check["mime"] != "image/png"  
      && $check["mime"] != "image/gif" && $check["mime"] != "image/webp") {
        echo "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
        $redirect = "/reset/new/?validate=mime_type";
    
        $uploadOk = 0;
      }
      
      // Check if $uploadOk is set to 0 by an error
      if (($uploadOk == 0) && (!($redirect))) {
        echo "Sorry, your file was not uploaded.";
        
      // if everything is ok, try to upload file
      } else {
          // echo "Hash: " . $hash;
          // echo "<br>NEW Hash: " . $hash . "<br>";
    
          //echo "<br>" . $sql . "<br>";
    
          // Create connection
          $conn = new mysqli($servername, $username, $password, $dbname);
    
          if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
          }
    
          $sql  = "SELECT * FROM Users WHERE";
          $sql .= "(email = '" . base64_encode($email) . "' OR phone='" . base64_encode($phone) . "') ";
          $sql .= "ORDER BY date LIMIT 1";
        
          $result = $conn->query($sql);
    
          if ($result->num_rows == 0) {
            // account already existsts
            //echo "There is already an account registered with either that email address or phone number.";
            $redirect = "/reset/new/?validate=not_found";
          } else {
    
            // save record to database
            $sql  = "UPDATE Users SET hash='" . $hash . "' ";
            $sql .= "WHERE (email = '" . base64_encode($email) . "' OR phone='" . base64_encode($phone) . "') ";
                
            if ($conn->query($sql) === TRUE) {
                //echo "New record created successfully";
    
                if ($email) {
                  sendEmail($email);
                }
    
                if ($phone) {
                  sendText($phone);
                }
    
                $redirect = "/reset/new/?reset=complete";
            } else {
                //echo "Error: " . $sql . "<br>" . $conn->error;
                $redirect = "/reset/new/?validate=server_error";
            }
            
          }
            
          $conn->close();
      }
    
}

if ($redirect) {
    header("Location: " . $redirect);
} else {
    header("Location: /reset/new/");
}

function sendText($to) {
    
  $account_sid = 'AC36cfa4acccbe03d9820e6898cd131364';
  $auth_token = 'd2ed84ab50af1cebadc58b057f3a0702';
  $twilio_number = "+18559996768"; // Twilio number you own

  $client = new Client($account_sid, $auth_token);
  // Below, substitute your cell phone
  $client->messages->create(
      $to,  
      [
          'from' => $twilio_number,
          'body' => 'Your Window to the World password has been reset! https://window-to-the-world.org/login'
      ] 
  );
}
  
function sendEmail($to) {
  // create email
  $api = "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";

  $email = new \SendGrid\Mail\Mail(); 
  $email->setFrom("info@ice9.ai", "Dorothy");
  $email->setSubject("Window to the World Pass-Photo Reset");
  $email->addTo($to, $to);
  $email->addContent("text/plain", "Success! Your password was reset. https://window-to-the-world.org/login");
  $email->addContent(
      "text/html", '<strong>Success!</strong><br>Your password was reset. <a href="https://window-to-the-world.org/login">Login to your account</a>'
  );

  // send email
  $sendgrid = new \SendGrid($api); //getenv('SENDGRID_API_KEY')
  try {
      $response = $sendgrid->send($email);
      print $response->statusCode() . "\n";
      print_r($response->headers());
      print $response->body() . "\n";
  } catch (Exception $e) {
      echo 'Caught exception: '. $e->getMessage() ."\n";
  }

}
?>