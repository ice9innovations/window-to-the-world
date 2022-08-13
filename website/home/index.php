<?PHP include("../inc/header.php"); ?>

<style>
    .text-left { text-align: left; }

    .diagram {
        width: 100%;

        border: 1px dotted #777;
        padding: 20px;

        margin: 0 0 40px 0;
    }

        .diagram IMG {
            display: block;
            width: 100%;

            border: 1px solid #777;
            outline: 0;
        }

    @media only screen 
    and (min-device-width: 375px) 
    and (max-device-width: 812px) 
    and (-webkit-min-device-pixel-ratio: 3) { 
        .diagram {
            padding: 40px;
        }
    }
</style>

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

                                <div class="diagram"><a href="https://giphy.com/gifs/salih-art-food-s6KzZwDzM6v5u" target="_new"><img src="/images/pancakes.gif"></a></div>

                                <div class="register">
                                    <h4>
                                    What is Window to the World?
                                    </h4>
                                    <p>
                                    Window to the World is a new app that's all about YOU. 
                                    It's an AI that learns what you like and what you dislike. 
                                    It shows you more of what you want to see and less 
                                    of what you don't. <a href="#">Learn more</a>
                                    </p>

                                    <p class="cta">
                                    Or just give it a try it! Go on. It can't hurt. <a href="#">The first one's free</a>    
                                    </p>
                                </div>
                                    <h4>
                                    How does it work?
                                    </h4>

                                    <p class="text-left">
                                        First we collect a set of random images from the web. Then we 
                                        scan them using AI based image scanning technology and tag them 
                                        with an emoji and show them to you. If you like it, we show you more 
                                        pictures like that. If you dislike it we show you less. Simple as that!
                                    </p>

                                </div>
                                

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>

<?PHP include("../inc/footer.php"); ?>