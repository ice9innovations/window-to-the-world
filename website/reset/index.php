<?PHP include("../inc/header.php"); ?>

<body class="logged-out" onload="porthole()">
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

                                <form id="reset" class="login" action="process_reset.php" method="POST" onsubmit="return validate()">
                                    <h4>Reset your Pass-Photo&trade; <span class="or">or <a href="/login">Sign In</a></span></h4>

                                    <p id="validate_phone">
                                        <label for="phone">Phone Number or Email Address</label>
                                        <input type="text" id="phone" name="phone">
                                        <span class="message">Phone or email is required</span>
                                    </p>
                                    
                                    <div class="container nopadding">
                                        <div class="row">
                                            <div class="col-sm-12 col-lg-12 center">
                                            <p>
                                                <input id="submit" name="submit" class="login-submit" type="submit" value="Reset my Password">
                                            </p>
                                            </div>
                                            <div class="col">
                                                <p class="TOC">
                                                    <!--
                                                    <i class="fa-solid fa-square-check"></i>
                                                    I agree to the <a href="/toc">Terms and Conditions</a>
                                                    -->
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                                    
                                <p>
                                    You can also: <a href="/register">Create a New Account</a> or <a href="mailto: dorothyisnotarobot@gmail.com">Contact Support</a>
                                </p>
                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function validate() {
            validateClear()
            
            var valid = true 
            var phone = document.getElementById("phone")

            if (!(phone.value)) {
                var validate_phone = document.getElementById("validate_phone")
                validate_phone.classList.add("validate")
                valid = false
            }

            return valid
        }

        
        function validateClear() {
            // clear all validation messages
            var validate_phone = document.getElementById("validate_phone")
            validate_phone.classList.remove("validate")
        }

    </script>

</body>

<?PHP include("../inc/footer.php");