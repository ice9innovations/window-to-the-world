<!DOCTYPE html>

<html lang="en-us">
  <head>
    <title>Window to the World</title>
    
    <meta name="viewport" content="width=device-width, initial-scale=.8, user-scalable=no">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="theme-color" content="#ffffff">
    
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">

    <link rel="stylesheet" href="/css/new.css">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet">

    <script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
        crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/ui/1.13.1/jquery-ui.js"></script>

    <script src="/js/pluralize.js"></script>
    <script src="/emojis/emojis.js"></script>

    <script src="/js/utils.js"></script>

    <script src="/js/new.js"></script>
    <script src="/js/big.js"></script>
    <script src="/js/navigation.js"></script>

    <script>
        // primary application settings
        var INITIAL_BATCH = 10 // at least twice the screen size
        var ITERATE = 1 // number of images per batch
        var SPEED = 5 // * 1000 ms, rate of delete # currently disabled
        var SCREEN_SIZE = 1
        var BUFFER_SCREENS = 1 // disabled
        var AD_RATE = 5 // percent
        var PD_RATE = 5 // public domain images
        var BACKPROP_RATE = -1
        var REFRESH_RATE = 24 // milliseconds
        var USER_SAVES = 1

        var username = "<?PHP echo $_SESSION["username"]; ?>"

        //var server = "https://i.imgur.com/"
        var server = "https://window-to-the-world.org"
        var server_path = "/images/mscoco/"
        var thumbnail_path = "/images/mscoco/tn/thumb."

        var extension = ".jpg"
        var thumbnail_extension = ".jpg"

        var pd_server = "https://img.window-to-the-world.org"

    </script>
    <script src="https://kit.fontawesome.com/cf2170d77e.js" crossorigin="anonymous"></script>

  </head>
  <body id="page" onload="init()">
  <?PHP
    //$_SESSION['username'] = "local"; // manual override while security is disabled

    //if (!(isset($_SESSION['username']))) {
    ?>

    <div id="loading"><p>Loading</p></div>
    
    <!-- Zoom Image -->
    <div id="overlay" class="overlay" onclick="hideOverlay()">
        <div id="bkg"></div>
        <div id="img"><img id="preview"></div>
    </div>

    <!-- Background Image -->
    <div id="tile"></div>

    <!-- Predictions -->
    <div id="predict">
        <div id="guess-final"></div>
        <div id="guess-second"></div>
    </div>

    <!-- Colors -->
    <div id="colors"></div>

    <main>
        <div id="present">
            <div id="buffer" class="test"></div>
            <div id="screen" class="ready">
                <a id="loading_image" href="#">
                    <img id="img-loading" src="https://window-to-the-world.org/login/tn/<?php echo $_GET["tn"] ?>" alt="loading">
                </a>
            </div>
        </div>
        <div id="past">
            <div id="history" class="delete"></div>
        </div>
        <div id="save"></div>
    </main>
    <div id="caption">
        <div id="guess-from-caption"></div>

        <div id="caption-BLIP"></div>
        <div id="caption-LLAMA"></div>
    </div>
    
    <!-- Page Navigation -->
    <nav id="navigation">
        <a id="back" href="javascript: reviewLastImage()"><span>Back</span></a>
        <a id="next" href="javascript: skipCurrentImage()"><span>Next</span></a>
    </nav>

    <!-- Preference Navigation -->
    <nav id="preference">
        <a id="dislike" href="javascript: dislikeCurrentImage()"><span>Dislike</span></a>
        <a id="hot" href="javascript: superCurrentImage()"><span>Superlike</span></a>
        <a id="like" href="javascript: likeCurrentImage()"><span>Like</span></a>
    </nav>

    <script>
        // Event handling happens in the <body>

        // Assign DOM elements to variables after HTML has been rendered
        var windowBuffer = document.getElementById("buffer")
        var windowScreen = document.getElementById("screen")
        var windowHistory = document.getElementById("history")
        var windowDeleted = document.getElementById("deleted")

        // EVENT MANAGEMENT
        document.addEventListener('keyup', function(e) {
            // functions are backwards
            // because the UI changed and they need
            // to be renamed...
            if ((e.key === "ArrowLeft") || (e.key === "a")) {
                //moveTapeRight(1)
                reviewLastImage()
            }

            if ((e.key === "ArrowRight") || (e.key === "d") || (e.key == " ")) {
                //moveTapeLeft(1)
                skipCurrentImage()            
            }

            if (e.key === "Escape") { // escape key maps to keycode `27`
                hideOverlay()
            }


            
            startPageTimer()
        }, false)

        // there are three of these... I wonder if any of them work
        document.body.addEventListener('touchmove', function(event) {
                //event.preventDefault()
            }, false)

        document.body.addEventListener('touchmove', function(e){ 
            e.preventDefault()
        })
        
        // clear zoomed image with a keypress for devices that support it
        window.addEventListener('keyup', function(e) {
            clearInterval(pageTimer)
            //clearInterval(fadeOut)
        }, false)

        // disable scrolling for mobile devices
        window.ontouchstart = function(e) { e.preventDefault() }
        window.addEventListener("scroll", preventMotion, false);
        window.addEventListener("touchmove", preventMotion, false);

        // does any of this actually even work?
        function preventMotion(event) {
            window.scrollTo(0, 0);
            event.preventDefault();
            event.stopPropagation();
        }

    </script>
    <!-- required by coco and obj -->
    <script src="bots/prefs.js"></script>
    <script src="bots/prefs_color.js"></script>
    <script src="bots/prefs_meta.js"></script>
    <!--<script src="bots/classify.js"></script>-->
    <script src="bots/public_domain.js"></script>
    <script src="bots/backpropagate.js"></script>

    <!-- load bots individually (can be batched up) -->
    <script src="/bots/snail.js"></script>
    <script src="bots/caption.js"></script>
    <script src="bots/blip.js"></script>
    <script src="bots/inception.js"></script>
    <script src="bots/yolo.js"></script>
    <script src="bots/coco.js"></script>
    <script src="bots/color.js"></script>
    <script src="bots/faces.js"></script>
    <script src="bots/llama.js"></script>
    <script src="bots/metadata.js"></script>
    <script src="bots/detectron.js"></script>
    <script src="bots/object.js"></script>
    <script src="bots/ocr.js"></script>
    <script src="bots/nsfw.js"></script>
    <script src="bots/clip.js"></script>

  </body>
</html>


<?PHP 
 //} else {
    //header("Location: /login");
 //}
?>
