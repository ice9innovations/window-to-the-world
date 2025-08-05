<?PHP 

include("../inc/header.php"); 
unset($_SESSION['username']);

?>
<style>
    .spacer { height: 20px; }

</style>


<body class="logged-out" onload="init()">
    <main>
        <div class="container">
            <div class="row">
                <div class="col-sm-12 col-md-12 col-lg-6">
                    <div class="graphic">
                        <a href="#" onclick="porthole()"><img class="porthole" src="/images/porthole-empty.png" alt="Window to the World"></a>
                        <div id="porthole-cover" class="porthole-cover"></div>
                    </div>
                </div>
                <div class="col-sm-12 col-md-12 col-lg-6">
                    <div class="spacer"></div>

                    <h2><a href="/">Window to the World</a></h2>
                    <h3><a href="https://ice9.ai">Ice 9 Innovations</a></h3>
                    
                    <div class="container nopadding">
                        <div class="row">
                            <div class="col">

                                <div id="error_message"></div>

                                <form id="login" class="login" action="process_login.php<?php echo !empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : ''; ?>" method="POST" enctype="multipart/form-data" onsubmit="return validate()">

                                    <div id="form_step_one">
                                        <p>
                                            Window to the World is all about YOU. 
                                            It learns what you like and what you dislike. 
                                            Then shows you more of what you want to see and less 
                                            of what you don't. <a href="https://github.com/ice9innovations/window-to-the-world">Learn more</a>
                                        </p>

                                        <p id="validate_file">
                                            <label id="picture" for="pic"><span>Upload a Picture to Continue</span></label>
                                            <input class="file" type="file" id="pic" name="pic" onchange="checkFile()">
                                            <span class="message" style="margin-top: -22px;">Please?</span>
                                        </p>
                                    </div>
                                    
                                    <div id="form_step_two">
                                        <h4>Sign In <span class="or">or <a href="/register">Create a Free Account</a></span></h4>
                                        <p id="validate_phone">
                                            <label for="phone">Phone Number or Email Address</label>
                                            <input type="text" id="phone" name="phone">
                                            <span class="message">Phone or email is required</span>
                                        </p>
                                    </div>
                                    
                                    <div id="btn_next" class="container nopadding">
                                        <div class="row">
                                            <div class="col-sm-12 col-md-12 col-lg-4">
                                                <p>
                                                    <input id="login_submit" name="login_submit" class="login-submit" type="submit" value="Continue">
                                                </p>
                                            </div>
                                            
                                            <div class="col-sm-12 col-lg-8">
                                                <p class="TOC">
                                                    <i class="fa-solid fa-square-check"></i>
                                                    I agree to the <a href="/toc">Terms and Conditions</a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div id="btn_submit" class="container nopadding">
                                        <div class="row">
                                            <div class="col-sm-12 col-lg-4">
                                                <p>
                                                <input class="login-submit" type="button" name="next" value="Next" onclick="getStep(2)">
                                                </p>
                                            </div>
                                            
                                            <div class="col-sm-12 col-lg-8">
                                                <p class="TOC">
                                                    <i class="fa-solid fa-square-check"></i>
                                                    I agree to the <a href="/toc">Terms and Conditions</a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </form>
                                
                            </div>
                        </div>
                    </div>

                    <p class="help">Help! I can't access my account. <a href="/reset">Reset my Password</a></p>

                    <div class="terms">

                        <p>
                        <strong>By using this system, you consent to the following conditions:</strong>

This is a technology demonstration. 
All data collected is saved based on the image that you use to login. No personally identifying information is collected or saved in this system.
The data that is being collected will be used to train this AI in the future. 
Copyright notice. All images are licencsed through COCO under the Creative Commons license.
We do not own the copyright for the images used in this demonstration.
The images used are part of the <a href="https://cocodataset.org/">COCO dataset</a>. COCO is a large-scale object detection, segmentation, and captioning dataset.
By testing our technology against a known scientific dataset, we are able to test our 
results against a benchmark. The COCO images have been peer reviewed and do not contain nudity. However, to report an image as inappropriate, please file an issue on the Window to the World 
<a href="https://github.com/ice9innovations/window-to-the-world/issues">GitHub Repo</a>.
                        </p>

<p>&nbsp;</p>
                        <p>
                        <!-- previous disclaimer 
                        <p>
                        These are not my images. They are randomly loaded from imgur. Because of that they could contain literally anything you can take a picture of. I take no responsibility for these images. They are NOT hosted on this server. They will not be seen by anyone but you and anyone else looking at your screen. To report an image, please report it at Imgur, the source of the data.
                        </p>

                        <p>
                        This project is intended to be a filter for these images. As it develops we will add nudity filters and other filters to make this datastream more pleasant to look at. In the meantime, enter at your own risk.
                        <strong>You must be 18 to continue.</strong>

                        </p>
                        -->
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        var step = 0
        
        function checkNext() {
            var ret = false
            if (step >= 1) {
                ret = validate()
            } else {
                getStep(2)
            }

            return ret
        }
        
        function getStep(which) {
            step = which

            console.log("get step: " + which)

            var valid = false
            valid = validateField("file")
            if (valid) {
                hideAllSteps()

                var el_id, btn_id
                switch (which) {
                    case 1:
                        el_id = "form_step_one"
                        btn_id = "btn_next"

                        break;
                    case 2:
                        el_id = "form_step_two"
                        btn_id = "btn_submit"

                        // remove complete flag
                        var file = document.getElementById("picture")
                        file.classList.remove("complete")

                        break;
                }

                var el, btn
                if (el_id) { el = document.getElementById(el_id) } // get the html element
                if (el) { el.style.display = "block"; } // show it

                if (btn_id) { btn = document.getElementById(btn_id) } // get the button element
                if (btn) { btn.style.display = "block"; } // show it
            }
        }

        function hideAllSteps() {
            var step1 = document.getElementById("form_step_one")
            var step2 = document.getElementById("form_step_two")
            var next = document.getElementById("btn_next")
            var submit = document.getElementById("btn_submit")

            var els = [step1, step2, next, submit]
            for (var i = 0; i < els.length; i++) {
                var el = els[i]
                el.style.display = "none";
            }
        }

        function validate() {
            validateClear()
            
            var valid = true 

            ///valid = validateField("phone")
            valid = validateField("file")
            
            var phone = document.getElementById("phone")

            if (!(phone.value)) {
                // var validate_phone = document.getElementById("validate_phone")
                //validate_phone.classList.add("validate")
                // valid = false
            }

            return valid
        }

        function validateField(field) {
            // get fields
            var phone = document.getElementById("validate_phone")
            var file = document.getElementById("validate_file")

            var valid = true
            var val = "validate_"
            switch (field) {
                case "phone":
                    var el = document.getElementById("phone")
                    var val = el.value

                    // value exists, validate
                    if (!(val)) {
                        phone.classList.add("validate")
                        valid = false
                    }
                    break
                case "file":
                    var el = document.getElementById("pic")
                    var val = el.value

                    if (!(val)) {
                        file.classList.add("validate")
                        valid = false
                    }
                    break
            }

            return valid
        }

        function checkFile() {
            var valid = false
            valid = validateField("file")

            if (valid) {
                
                var el = document.getElementById("picture")
                el.classList.add("complete")

                var validate_file = document.getElementById("validate_file")
                validate_file.classList.remove("validate")

            }
        }
        
        const validateEmail = (email) => {
            return String(email)
                .toLowerCase()
                .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                )
        }

        const validatePhone = (phone) => {
            return String(phone)
                .match(
                    /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
                )
        }

        function validateClear() {
            // clear all validation messages
            var validate_phone = document.getElementById("validate_phone")
            var validate_file = document.getElementById("validate_file")

            validate_phone.classList.remove("validate")
            validate_file.classList.remove("validate")
        }

    
        function validateServer() {
            var qs = window.location.search

            var error_text = ""
            if (qs.includes("not_uploaded")) { error_text = "There was an error uploading the file" }
            if (qs.includes("not_an_image")) { error_text = "This is not an image file" }
            if (qs.includes("too_large")) { error_text = "That file is too large (max 500KB)" }
            if (qs.includes("image_too_large")) { error_text = "Image dimensions too large (max 4096x4096)" }
            if (qs.includes("mime_type")) { error_text = "Unsupported image format (only JPG, PNG, GIF, WebP allowed)" }
            if (qs.includes("invalid_extension")) { error_text = "Invalid file extension" }
            if (qs.includes("server_error")) { error_text = "Server error - please try again" }
            if (qs.includes("upload_error")) { error_text = "Upload error - please check your file" }
            if (qs.includes("rate_limited")) { error_text = "Too many attempts. Please wait 5 minutes before trying again." }
            if (qs.includes("not_found")) { error_text = "These are not the droids you are looking for." }
                                    
            if (error_text) {
                var el = document.getElementById("error_message")
                el.innerHTML = error_text
                el.style.display = "block"
            }
        }

        validateServer()
            
    </script>
</body>

<?PHP include("../inc/footer.php"); ?>
