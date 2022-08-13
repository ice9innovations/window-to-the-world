<?PHP 
include("../inc/db.php");
include("../inc/thumbnail.php");

ini_set('session.gc_maxlifetime', 1440);
session_start();

$email_or_phone = base64_encode(strtolower(trim($_POST["phone"])));
//$phone = trim(preg_replace('/\D/', '', $_POST["phone"]));

$target_dir = "./uploads/";
$target_file = $target_dir . uniqid(); // basename($_FILES["pic"]["name"]);

$err = "";
$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

$welcome_back = false;

$redirect = "";
$tn_data = "";

// Check if image file is a actual image or fake image
if(isset($_POST["submit"])) {
  $check = getimagesize($_FILES["pic"]["tmp_name"]);
  if($check !== false) {
    // echo "File is an image - " . $check["mime"] . ".";
    $uploadOk = 1;
  } else {
    // echo "File is not an image.";
    $redirect = "/login/?validate=not_an_image";
    $uploadOk = 0;
  }
}

// Check if file already exists
if (file_exists($target_file)) {
    //echo "Sorry, file already exists.";
    //$uploadOk = 0;
}
  
  // Check file size
  if ($_FILES["pic"]["size"] > 500000) {
    $err = "Sorry, your file is too large.";
    //echo $err;
    $redirect = "/login/?validate=too_large";
    $uploadOk = 0;
  }
  
  // Allow certain file formats
  //echo "MIME TYPE: " . $check["mime"] . "<br>";

  if ($check["mime"] != "image/jpeg" && $check["mime"] != "image/png"  
  && $check["mime"] != "image/gif" && $check["mime"] != "image/webp" ) {
    $err = "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
    //echo $err;
    $redirect = "/login/?validate=mime_type";
    $uploadOk = 0;
  }
  
  // Check if $uploadOk is set to 0 by an error
  if (($uploadOk == 0) && (!($redirect))) {
    $err = "Sorry, your file was not uploaded.";
    $redirect = "/login/?validate=not_uploaded";

  // if everything is ok, try to upload file
  } else {

    if (move_uploaded_file($_FILES["pic"]["tmp_name"], $target_file)) {
      //echo "The file ". htmlspecialchars( basename( $_FILES["pic"]["name"])). " has been uploaded to " . $target_file . "<br>";
      $hash = sha1(file_get_contents($target_file));

      $tn_path = "/var/www/html/login/tn/" . uniqid();
      $thumb = new Thumbnail($target_file);
      $thumb->createThumb($tn_path, 250);

      // echo $tn_path . "<br>";

      $tn_data = urlencode(base64_encode(file_get_contents($tn_path)));
      unlink($target_file);

        //echo $email_or_phone . "<br>";

        //echo $_FILES["pic"]["tmp_name"] . "<br>";
        //echo $hash;

        // Create connection
        $conn = new mysqli($servername, $username, $password, $dbname);
        // Check connection
        if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
        }

        $sql  = "SELECT * FROM Users WHERE ";
        // $sql .= "(email = '" . $email_or_phone . "' OR phone='" . $email_or_phone . "') ";
        $sql .= "hash = '" . $hash . "' AND active=true ORDER BY date LIMIT 1";

        // echo $sql;

        $result = $conn->query($sql);
        $activity_sql = "";

        if ($result) {

            $username = "";
            if ($result->num_rows > 0) {
              // output data of each row
                $welcome_back = true;
                $userID = 0;

                while($row = $result->fetch_assoc()) {                
                    // Process login and redirect
                    if ($row["email"]) {
                        $username = $row["email"];
                        //$_SESSION["username"] = $row["email"];
                    } else {
                        if ($row["phone"]) {
                            $username = $row["phone"];
                            //$_SESSION["username"] = $row["phone"];
                        }
                    }

                    // ignore the previous and set the username
                    // to the image hash
                    $_SESSION["username"] = $row["hash"];
                    $redirect = "/";

                    // Create query for recent activity
                    $userID = $row["userID"];                    
                    if ($userID) {
                        // update activity table
                        $activity_sql = "INSERT INTO Activity (userID, username, thumbnail) VALUES (" . $userID . ", '" . $username . "','". urldecode($tn_data) . "');";
                    }
                }

            } else {
                // create an account
                $_SESSION["username"] = $hash;

                $createuser_sql = "INSERT INTO Users (hash, active) VALUES (" . $hash . ", 'true')";
                $redirect = "/";

            }
        } else {
            $redirect = "/login/?validate=server_error";
        }

        // log recent activity
        if ($createuser_sql) {
          // echo $activity_sql;
          $conn->query($createuser_sql);
        }

        // log recent activity
        if ($activity_sql) {
            // echo $activity_sql;
            $conn->query($activity_sql);
        }
        

    } else {
        $err = "Sorry, there was an error uploading your file.";
        //echo $err;
        $redirect = "/login/?validate=upload_error";
    }
  }

  // set welcome back flag in session
  $conn->close();

  // set welcome back flag
  if ($redirect) {

    if ($tn_path) {
        $tn_path = str_replace("/var/www/html/login/tn/", "", $tn_path);

        if (strpos($redirect, "/login/") != false) {
            $repl = "/login/?tn=" . $tn_path;
            $redirect = str_replace("/login/?", $repl, $redirect);
            $redirect .= "&ret=" . $welcome_back;
        }
        if ($redirect == "/") {
            $redirect = "/?tn=" . $tn_path;
            $redirect .= "&ret=" . $welcome_back;
        }


    }
    header("Location: " . $redirect);
  } else {
    header("Location: /");
  }

?>