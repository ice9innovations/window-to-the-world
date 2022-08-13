<?PHP 

include("../inc/sendgrid/sendgrid-php.php"); // If you're using Composer (recommended)
include("../inc/db.php");
include("../inc/secret.php");
include("../inc/thumbnail.php");

// why are these different?
require '../inc/twilio/twilio-php-main/src/Twilio/autoload.php';
require '../inc/secret.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ERROR);

use Twilio\Rest\Client;

$time = time();
$reset_link = "https://window-to-the-world.org/reset/";
$reset_link .= "?reset";

// either email or phone
$email_or_phone = trim($_POST["phone"]);
$post_phone = "";
$post_email = "";

if (!filter_var($email_or_phone, FILTER_VALIDATE_EMAIL)) {
    // invalid email address
    $post_phone = base64_encode(trim(preg_replace('/\D/', '', $_POST["phone"])));
} else {
    $post_email = base64_encode(strtolower($_POST["phone"]));
}

//$phone = trim(preg_replace('/\D/', '', $_POST["phone"]));

$target_dir = "./uploads/";
$target_file = $target_dir . uniqid(); // basename($_FILES["pic"]["name"]);

//echo $target_file . "<br>";

$err = "";
$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

$redirect = "/reset/";
$tn_data = "";

$reset = "";
if ($post_phone) {
    $reset = "sms";
}

if ($post_email) {
    $reset = "email";
}

// Check if image file is a actual image or fake image
if(isset($_POST["submit"])) {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
    }

    $sql  = "SELECT * FROM Users WHERE ";
    $sql .= "(email = '" . $post_email . "' OR phone='" . $post_phone . "') ";
    $sql .= " AND active=true ORDER BY date LIMIT 1";

    //echo $sql . "<br>";

    $result = $conn->query($sql);
    $activity_sql = "";

    if ($result) {

        $username = "";
        if ($result->num_rows > 0) {
        // output data of each row
            $userID = 0;

            $email = "";
            $phone = "";

            while($row = $result->fetch_assoc()) {            
                // retrieve the user's contact info
                $userID = $row["userID"];                    

                if ($row["email"]) {
                    $email = $row["email"];
                } 

                if ($row["phone"]) {
                    $phone = $row["phone"];
                }
            }


            // user entered an email address
            if ($email == $post_email) {
                // send email (because it's free)
                //echo base64_decode($email) . "<br>";

                sendEmail(base64_decode($email), $time);
                $redirect .= "?reset=email";
                $reset = "email"; //urlencode(base64_decode($email));
            } else {
                // user entered a phone number
                if ($phone) {
                    // send text message
                    echo base64_decode($phone) . "<br>";
                    sendText(base64_decode($phone), $time);
                    $redirect .= "?reset=sms";
                } else {
                    // no jk, send an email anyway
                    //echo base64_decode($email) . "<br>";
                    sendEmail(base64_decode($email), $time);
                    $redirect .= "?reset=email";
                    $reset = "email"; //urlencode(base64_decode($email));
                }
            }
            
        }
    }

    $conn->close();

    //echo $redirect;
    
    $redirect = "/reset/?reset=" . $reset;
    header("Location: " . $redirect);
}


function sendText($to, $time_code) {
    $sms = 'Reset your Window to the World Password: https://window-to-the-world.org/reset/new/?phone=' . $to . '&reset=' . $time_code;

    $account_sid = 'AC36cfa4acccbe03d9820e6898cd131364';
    $auth_token = 'd2ed84ab50af1cebadc58b057f3a0702';
    $twilio_number = "+18559996768"; // Twilio number you own
  
    $client = new Client($account_sid, $auth_token);
    // Below, substitute your cell phone
    $client->messages->create(
        '+19198273185',  
        [
            'from' => $twilio_number,
            'body' => $sms
        ] 
    );
  }

function sendEmail($to, $time_code) {
    // create email
    $api = "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";

    $html= '<a href="https://window-to-the-world.org/reset/new/?email=' . $to . '&reset=' . $time_code . '">Reset your Window to the World Password</a>';
    $txt = 'Reset your Window to the World Password:\n\n https://window-to-the-world.org/reset/new/?email=' . $to . "&reset=" . $time_code;

    $email = new \SendGrid\Mail\Mail(); 
    $email->setFrom("info@ice9.ai", "Dorothy");
    $email->setSubject("Reset your Password - Window to the World");
    $email->addTo($to, $to);
    $email->addContent("text/plain", $txt);
    $email->addContent(
        "text/html", $html
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