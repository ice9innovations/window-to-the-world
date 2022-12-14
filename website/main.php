<?PHP 
//if (isset($_SESSION['username'])) {
?>

<!DOCTYPE html>

<html lang="en-us">
  <head>
    <title>Window to the World - A Random Gallery</title>
    
    <meta name="viewport" content="width=device-width, initial-scale=.8, user-scalable=no">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="theme-color" content="#ffffff">
    
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">

    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="//code.jquery.com/ui/1.13.1/themes/base/jquery-ui.css">

    <script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4="
        crossorigin="anonymous"></script>
    <script src="https://code.jquery.com/ui/1.13.1/jquery-ui.js"></script>

    <script src="/js/pluralize.js"></script>

    <script>
        // primary application settings
        var INITIAL_BATCH = 15 // at least twice the screen size
        var ITERATE = 2 // number of images per batch
        var SPEED = 30 // * 1000 ms, rate of delete
        var SCREEN_SIZE = 6
        var BUFFER_SCREENS = 3
        var AD_RATE = 1 // percent
        var PD_RATE = 5 // public domain images
        var BACKPROP_RATE = -1

        var initialized = false
        
        var emojis = []
        var username = "<?PHP echo $_SESSION["username"]; ?>"

        function init() {
            if (!(initialized)) {
                // load an initial buffer of images

                getImages(INITIAL_BATCH) // should pull from DB now

                fillScreen()
                initialized = true
                
                var lastImg
                /*
                buffcount = setInterval(function() {

                    // auto delete
                    var pref_count = 0
                    $("#present .prefs_delete").each(function() {
                        if (pref_count == 0) {

                            var tmp = $(this)
                            var a = tmp[0]
                            console.log("Automatically deleting filtered images")

                            var anchor = document.getElementById(a.id)
                            var imgs = anchor.getElementsByTagName('img')
                            var iID = imgs[0]

                            if (iID) {
                                
                                var tmpID = iID.id 
                                tmpID = tmpID.replace("img-","").replace("ad-","")
                                
                                
                                // currently showing image
                                console.log("Deleting: " + iID.id)
                                var delEl = document.getElementById(tmpID)
                                deleteImage(tmpID, true)
                            
                            }

                        }
                        //deleteImage(img.id)
                        pref_count++
                    })
                    
                }, 500) 
                */

                autodelete = setInterval(function() {
                    // screen and buffer but anything that
                    // makes it into the history stays
                    $(".predict_404").remove()

                    $("#screen .auto_delete").each(function() {
                        $(this).remove()

                        // wiggle with it
                        moveTapeLeft(1)
                        moveTapeRight(1)
                    })

                    $("#buffer .auto_delete").each(function() {
                        $(this).remove()

                        // wiggle with it
                        //moveTapeLeft(1)
                        //moveTapeRight(1)
                    })

                    if (windowScreen.innerHTML == "") {
                        moveTapeLeft(1)
                        // reset timer
                        //clearWatcher(pageTimer)
                        //startPageTimer()
                    }
                }, 500)

                var color_set 
                pred_count = setInterval(function() {
                    var cur = getCurrentImage()
                    var img = document.getElementById(cur)

                    tagImage(cur, "action_shown")
                    // get predictions in json format
                    var preds = updatePrediction(img)

                    if (preds) {
                        var ta = document.getElementById("guess") // textarea
                        var col = document.getElementById("colors") // textarea
                        
                        // create html from colors
                        var htmlColors = []
                        if (preds.colors) {
                            var tmpCls = ""
                            var aColors = preds.colors

                            for (var i = 0; i < aColors.length; i++) {
                                var c = aColors[i]
                                var div = '<span class="color ' + tmpCls + '" style="background-color: #' + c + '"></span>'
                                htmlColors.push(div)
                            }
                        }

                        // set page background to gray
                        if (preds.colors) {
                            var tmpCls = ""
                            var aColors = preds.colors

                            //var page = document.getElementById("chantilly")
                            setPageBackground(cur)

                            var rndCol = Math.floor(Math.random() * aColors.length - 1)
                            rndCol++ // skip first one
                            for (var i = 0; i < aColors.length; i++) {
                                var c = aColors[i]
                                if (c) {
                                    c = "#" + c
                                }

                                if (i == 2)  { // rndCol // (aColors.length - 1)    
                                    if (cur != color_set) {
                                        console.log("Setting background to " + c)
                                        $(page).animate( { backgroundColor: c } )
                                    }

                                    color_set = cur
                                }
                                
                                if (i == 3) {
                                    var bc = ""
                                    bc = img.style.borderColor
                                    bc = bc.replace("#","").toLowerCase()

                                    // not red or green
                                    if ((bc != "ff0000") && (bc != "00ff00")) {
                                        img.style.borderColor = c
                                    }
                                }


                            }
                        }

                        col.innerHTML = htmlColors.join(" ")
                        //ta.innerHTML = preds.tags.join(" ")
                        ta.innerHTML = preds.emojis.join(" ")
                    }

                    // get an image from the public domain                    
                    var rndPD = Math.floor(Math.random() * 100)
                    if (rndPD < PD_RATE) {
                        var search_term = getPublicDomainSearchTerm(preds, cur)
                        if (search_term) {
                            //console.log("Search the public domain for a similar image: " + search_term)
                            PDworker(search_term)
                        }

                    }

                    // backpropagate existing images from the database
                    var rndBP = Math.floor(Math.random() * 100)
                    if (rndBP < BACKPROP_RATE) {
                        var emo = getBackpropagationEmojis(preds, cur) 
                        BACKPROPAGATEworker(emo, username)
                    }

                    // get advertisements 
                    var rnd = Math.floor(Math.random() * 100)
                    if (rnd < AD_RATE) {
                        getAdvertisement()
                    }

                    
                }, 1000)
            }

            getEmojis()
        }

        function setPageBackground(which) {
            //console.log("PAGE BACKGROUND: " + which)
            //console.log(preds)
            var tile = document.getElementById('tile')
            var el = document.getElementById(which)

            var bkg = ""
            var chosen = false
            var anim = false

            if (!(anim)) {
                bkg = "" // temporary clear
            }

            if (bkg) {
                console.log(bkg)
                tile.style.backgroundImage = 'url("' + bkg + '")'

                if (anim) {
                    tile.style.opacity = .2
                    tile.style.backgroundRepeat = "no-repeat"
                    tile.style.backgroundPosition = "center center"
                    tile.style.backgroundSize = "cover"
                } else {
                    tile.style.opacity = .05
                    tile.style.backgroundRepeat = "repeat"
                    tile.style.backgroundPosition = "auto"
                    tile.style.backgroundSize = "auto"
                }
            } else { 
                tile.style.backgroundImage = ""
                var img = el.src

                if (img.includes("img.")) {
                    // it's an ad
                    img = img.replace("/tn/","/img/")
                } else {
                    img = img.replace("b.jpg",".jpg")
                }

                tile.style.backgroundImage = 'url("' + img + '")'

                tile.style.opacity = .11
                tile.style.backgroundRepeat = "no-repeat"
                tile.style.backgroundPosition = "center center"
                tile.style.backgroundSize = "cover"
            }
        }

        async function getEmojis() {
           const response = await fetch('/emojis/emojis4.json')
           const json = await response.json()
           
           emojis = json
        }

        var lastCpt = ""
        function captionConfirmPrediction(img, emojis_from_image) {
            // even though this seems redundant, doing it the "correct"
            // way kills performance, so don't do that

            var confirmed = []
            var confirmed_emojis = []
            var g = document.getElementById("guess")

            if (img) {
                var cn = ""
                if (img.className) { cn = img.className }

                image_tags = cn.split(" ")
                caption = img.alt

                // lookup emoji in emoji table
                // loop entire emoji table
                
                // loop emoji tags from image
                for (var i = 0; i < emojis_from_image.length; i++) {
                    var tmp = emojis_from_image[i]
                    
                    for (var ii = 0; ii < emojis.length; ii++) {
                        var e = emojis[ii]
                        var key = Object.keys(e)[0]
                        var val = e[key]

                        var e = JSON.stringify(e)

                        if (val == tmp) {
                        // emoji was found
                            var txt = key.replace(/_/g," ")
                            image_tags.push(txt)
                        }
                    }
                }

                if (caption) {
                    var yolo7 = ""
                    // collect caption from YOLO and add to combined caption
                    for (var i = 0; i < image_tags.length; i++) {
                        var t = image_tags[i]

                        if (t.includes("YOLO")) {
                            yolo7 = t.replace("YOLO-","").replace(/-/g," ")
                        }
                    }

                    combined_caption = img.alt + " " + img.title + " " + yolo7// append title to alt to compare both 
                    var object_tags = []
                    var emojis_from_caption = emojisFromCaption(combined_caption)
                    
                    //console.log("EMOJIS FROM CAPTION")
                    //console.log(emojis_from_caption)

                    var final_el = document.getElementById("guess-final")
                    var guess_el = document.getElementById("guess")
                    var cpt_el = document.getElementById("guess-from-caption")
                    var cpt_val = (guess_el.innerHTML + " " + emojis_from_caption.join(" ")).replace(","," ")

                    acpt = cpt_val.split(" ")
                    acpt = acpt.sort()

                    //cpt_el.innerHTML = acpt.join(" ")

                    var count = {};
                    acpt.forEach(element => {
                        count[element] = (count[element] || 0) + 1;
                    }) 


                    var first_place = ""
                    var second_place = ""
                    for (var emo in count) {
                        cnt = count[emo]
                        if (cnt != 1) {
                            if (emo) {
                                first_place += emo + " "
                            }
                        } else {
                            if (emo) {
                                second_place += emo + " "                                
                            }
                        }
                        //console.log(emo + ": " + cnt)
                    }

                    final_el.innerHTML = first_place
                    cpt_el.innerHTML = second_place

                    // collect object and multi tags from the image
                    for (var i = 0; i < image_tags.length; i++) {
                        var t = image_tags[i]

                        if (t.includes("object") || (t.includes("multi"))) {
                            t = t.replace("object_","").replace("multi_","")

                            // drop probability
                            var tA = t.split("-")
                            var obj = tA[0]

                            // split into words and append
                            // must be a function or it bogs down
                            object_tags = splitIntoWordsAndAppend(obj, object_tags)

                            //object_tags.push(obj.replace(/_/g," "))
                        }
                        
                        if (t.includes("faces")) {
                            t = t.replace("faces_","")
                            var val = parseInt(t)

                            if (val > 0) {
                                object_tags.push("person")
                            }
                        }
                        
                    }

                    // check for specific objects

                    // check for people        
                    var person_from_caption = false
                    var person_from_tags = false
                    
                    person_from_caption = captionConfirmPerson(combined_caption)
                    person_from_tags = captionConfirmPerson(object_tags.join(" "))

                    if (person_from_caption && person_from_tags) {
                        confirmed.push("person")
                        confirmed_emojis.push("🙍")
                        tagImage(img.id, "confirmed_person")
                    } 

                    // check for matching words
                    for (var i = 0; i < object_tags.length; i++) {
                        var tag = object_tags[i]
                        if (combined_caption.includes(tag)) {
                            confirmed.push(tag)

                            var emo = findEmoji(tag.replace(/ /g,"_"))

                            if (emo) {
                                confirmed_emojis.push(emo)
                            }

                            //tagImage(img.id, "confirmed_" + tag)
                        }
                    }
                                        
                }
            }
            
            // remove duplicates
            confirmed_duplicates = confirmed_emojis
            confirmed = [...new Set(confirmed)]
            //confirmed_emojis = [...new Set(confirmed_emojis)]
            //emojis_from_caption = [...new Set(confirmed_emojis)]
            

            // corroborate final list
            var guess_el = document.getElementById("guess")
            var guess = guess_el.innerHTML
            var final = []
            
            //console.log("CONFIRMED")
            //console.log(confirmed_emojis)

            guess_el.innerHTML = ""
            guess_el = guess + confirmed_emojis

            for (var i = 0; i < confirmed_emojis.length; i++) {
                var cnf = confirmed_emojis[i]
                if (guess.includes(cnf)) {
                    final.push(cnf)

                    var cls = "confirmed_" + cnf

                    if (!(img.className.includes(cls))) {
                        // only add once
                        console.log("Tagging image " + img.id + " with confirmed_" + cnf)
                        tagImage(img.id, cls)
                    } 
                }
            }

            var final_ns = final
            final = [...new Set(final)]
            updateConfirmedPrediction(final)

            var confirmBLIP = []
            var confirmedBLIP = []
            if (img) {
                if (img.alt) {
                    console.log("CONFIRM BLIP: " + img.alt)
                    confirmBLIP = emojisFromCaption(img.alt)

                    for (var i = 0; i < confirmBLIP.length; i++) {
                        var blipemo = confirmBLIP[i]
                        
                        for (var ii = 0; ii < final_ns.length; ii++) {
                            var finalemo = final_ns[ii]

                            if (blipemo === finalemo) {
                                confirmedBLIP.push(blipemo)
                            }
                        }
                    }

                    console.log("CONFIRMED BLIP")
                    console.log(confirmBLIP)
                    console.log(final_ns)
                    //console.log(confirmedBLIP)

                    pred_capt_el = document.getElementById("predict-caption")
                    pred_capt_el.innerHTML = pred_capt_el.innerHTML + " [" + confirmedBLIP.length + "]" 
                }

            }


            return final
        }

        function captionMatchesCaption(img) {
          var capt_A = img.alt
          var capt_B = img.title

          var ret = []

          if (capt_A && capt_B) {
            var arrA = capt_A.split(" ")
            var arrB = capt_B.split(" ")

            for (var i = 0; i < arrA.length; i++) {
              var caption_A = arrA[i]
              for (var ii =0; i < arrB.length; ii++) {
                var caption_B = arrB[ii]
                if (caption_A == caption_B) {
                  ret.push(caption_A)
                }
              }
            }
          }

          return ret
        }

        function splitIntoWordsAndAppend(obj, object_tags) {
            var ret = object_tags
            if (obj) {
                aObj = obj.split("_")
                for (var i = 0; i < aObj.length; i++) {
                    var word = aObj[i]
                    if (object_tags) {
                        ret.push(pluralize.singular(word))
                    }
                }
            }
            return ret
        }

        function emojisFromCaption(caption) {
            var emojis_from_caption = []

            var aCaption = caption.split(" ")
            for (var i = 0; i < aCaption.length; i++) {
                var word = aCaption[i]
                var emoji = findEmoji(pluralize.singular(word))
                if (emoji) {
                    emojis_from_caption.push(emoji)
                }
            }

            return emojis_from_caption
        }

        function captionConfirmPerson(tags) {
            var person = false

            // add all possible combinations                            
            var person_tags = [
                "adult", 
                "face", 
                "faces", 
                "person", 
                "people", 
                "male", 
                "female", 
                "woman", 
                "man", 
                "boy", 
                "girl", 
                "baby", 
                "child", 
                "children", 
                "women", 
                "men",
                "wig",
                "player",
                "character",
                "girls",
                "kids",
                "guys",
                "student" 
            ]

            for (var i = 0; i < person_tags.length; i++) {
                var person_tag = person_tags[i]
                //console.log("EVAL: " + tags + " vs " + person_tag + " = " + (tags.includes(person_tag)))

/*
                var aTags = tags.split(" ")
                for (var ii = 0; ii < aTags.length; ii++) {
                    var tag = aTags[ii]

                    if (tag == person_tag) {
                        person = true

                    }
                }
*/
                if (tags.includes(person_tag)) {
                    person = true
                }
            }

            return person
        }

        function updatePrediction(img) {
            // get predictions
            var predict = []
            var colors = []
            var grays = []
            var search_tags = []
            var objects_combined = []

            var maxconf_multi = 0
            var maxconf_single = 0
            var secondconf_single = 0
            var faces = false
            
            if ((typeof img) == "string") {
                ifmg = document.getElementById(img)
            }
            
            if (img) {
                // get the image
                var clss = img.className
                if (clss) {

                    var aCls = clss.split(" ")

                    // precalculate max confidence
                    for (var i = 0; i < aCls.length; i++) {
                        var tmpCls = aCls[i]
                        if (tmpCls.includes("multi_")) {
                            var tmp = tmpCls.replace("multi_","")
                            var aTmp = tmp.split("-")
                            var conf = aTmp[1]

                            if (conf > maxconf_multi) {
                                maxconf_multi = Math.round(conf)
                            }
                        }
                    }

                    // precalculate max confidence
                    for (var i = 0; i < aCls.length; i++) {
                        var tmpCls = aCls[i]
                        if (tmpCls.includes("object_")) {
                            var tmp = tmpCls.replace("object_","")
                            var aTmp = tmp.split("-")
                            var conf = aTmp[1]

                            if (conf > maxconf_single) {
                                maxconf_single = Math.round(conf)
                            }
                        }
                    }

                    // precalculate second highest confidence
                    for (var i = 0; i < aCls.length; i++) {
                        var tmpCls = aCls[i]
                        if (tmpCls.includes("object_")) {
                            var tmp = tmpCls.replace("object_","")
                            var aTmp = tmp.split("-")
                            var conf = aTmp[1]

                            if (conf > secondconf_single) {
                                if (conf < maxconf_single) {
                                    secondconf_single = Math.round(conf)
                                }
                            }
                        }
                    }

                    for (var i = 0; i < aCls.length; i++) {
                        var cls = aCls[i]

                        // remove avm predictions
                        //cls = cls.replace("predict_animals","")
                        //cls = cls.replace("predict_vegetables","")
                        //cls = cls.replace("predict_minerals", "")
                        
                        if (cls.includes("text_")) {
                            predict.push("text")
                        }

                        if (cls.includes("content_")) {
                            var tmp = cls.replace("content_","")
                            var aTmp = tmp.split("-")
                            var content = aTmp[0]

                            //predict.push(content)
                        }

                        var target_conf = 3
                        if (cls.includes("multi_")) {
                            var tmp = cls.replace("multi_","")
                            var aTmp = tmp.split("-")
                            var obj = aTmp[0]
                            var conf = aTmp[1]

                            objects_combined.push(obj)

                            if (conf == maxconf_multi) {
                                search_tags.push(obj)

                                // adjust required confidence for person
                                if (obj == "person") {
                                    target_conf = 9
                                } 

                                if (conf > target_conf) {
                                    predict.push(obj) // + "-" + conf
                                }
                            }
                        }

                        if (cls.includes("object_")) {
                            var tmp = cls.replace("object_","")
                            var aTmp = tmp.split("-")
                            var obj = aTmp[0]
                            var conf = aTmp[1]

                            objects_combined.push(obj)

                            if ((conf == maxconf_single) || (conf == secondconf_single)) {
                                if (conf > 1) {
                                    if  (conf != secondconf_single) {
                                        // first is the worst
                                        predict.push(obj) // + "-" + conf
                                        search_tags.push(obj)
                                    } else {
                                        // second chance if worse than chance
                                        if (conf > target_conf) {
                                            predict.push(obj) 
                                            search_tags.push(obj)
                                        }
                                    }
                                }
                            }
                        }

                        // get age and gender predictions from captions
                        if (cls.includes("BLIP")) {
                            var cls_clean = cls.replace("BLIP-","").replace(/-/g," ")
                            updateCaption(cls)

                        }

                        // get age and gender predictions from captions
                        if (cls.includes("YOLO")) {
                            yolo = document.getElementById("yolo")
                            yolo.innerHTML = cls.replace("YOLO-","").replace(/-/g," ")
                            //updateCaption(cls)
                        }

                        if (cls.includes("faces_")) {
                            var tmp = parseInt(cls.replace("faces_",""))
                            //var aTmp = tmp.split("_")
                            //var obj = aTmp[0]
                            //var conf = aTmp[1]

                            var ret = ""
                            if (tmp > 0) { 
                                faces = true 
                                ret = "face" 
                            }

                            if (ret) { 
                                predict.push(ret) // + "-" + conf
                                predict.push("face") // + "-" + conf
                                //predict.push("animals") // + "-" + conf
                            }
                        }

                        if (cls.includes("meta")) {
                            var tmp = cls.replace("meta_","")
                            var aTmp = tmp.split("-")
                            var key = aTmp[0]
                            var val = aTmp[1]

                            if (key == "display_mode") {
                                predict.push(val)
                            }

                            var skipped = false
                            if (key == "filesize") {
                                var fs = parseInt(val)
                                // filesize is xbelow 5k
                                if (fs < 5) { 
                                    // skip and automatically delete
                                    predict.push("skipped")
                                    tagImage("auto_delete",img.id)
                                    skipped = true
                                }
                            }

                            if (key == "megapixels") {
                                var mp = Math.round(val / 100)
                                switch (mp) {
                                    case 0:
                                    case 1:
                                        if (!(skipped)) {
                                            //predict.push("bargain")
                                        }
                                        break
                                    case 2:
                                    case 3:
                                    case 4:
                                        //predict.push("acceptable")
                                        break
                                    default: 
                                        //predict.push("passing")
                                    /*
                                    case 0:
                                        predict.push("zero")
                                        break
                                    case 1:
                                        predict.push("one")
                                        break
                                    case 2:
                                        predict.push("two")
                                        break
                                    case 3:
                                        predict.push("three")
                                        break
                                    case 4:
                                        predict.push("four")
                                        break
                                    case 5:
                                        predict.push("five")
                                        break 
                                    case 6:
                                        predict.push("six")
                                        break 
                                    case 7:
                                        predict.push("seven")
                                        break 
                                    case 8:
                                        predict.push("eight")
                                        break
                                    case 9:
                                        predict.push("nine")
                                        break 
                                    default:
                                        predict.push("ten")
                                    */
                                }
                                if (mp > 10) {
                                    predict.push("excellent")
                                }
                            }
                        }

                        if (cls.includes("predict")) {
                            var tmp = cls.replace("predict_","")
                            var aTmp = tmp.split("-")
                            var output = aTmp[0]

                            if (output == "nsfw") {
                                predict.push("nsfw")
                            } else {
                                //predict.push("sfw")
                            }

                            if ((faces) || (output == "person") || (output == "people")) {
                                if ((clss.includes("caption_male"))) {
                                    //predict.push("male")
                                }

                                if (clss.includes("caption_female")) {
                                    //predict.push("female")
                                }

                                if (clss.includes("caption_mixed_gender")) {
                                    //predict.push("male")
                                    //predict.push("female")
                                }

                                if ((clss.includes("caption_young"))) {
                                    predict.push("baby")
                                }

                                if (clss.includes("caption_adult")) {
                                    //predict.push("adult")
                                }

                                if (clss.includes("caption_baby")) {
                                    predict.push("baby")
                                }

                                if (clss.includes("caption_mixed_age")) {
                                    if (!((clss.includes("caption_male")) || (clss.includes("caption_female")))) {
                                        //predict.push("mixed_ages") // can't be mixed, just unknown
                                    }
                                }

                                faces = false // reset
                            }

                            if ((output) && (output != "undefined")) {
                                predict.push(output)
                            }
                        }

                        // clear extras
                        cls = cls.replace("predict_person", "")

                        // show colors
                        if (cls.includes("color")) {
                            var c = cls.replace("color_","")
                            var tmpCls = ""
                            if (c.includes("actual")) { tmpCls = "primary" }
                            if (c.includes("nearest")) { tmpCls = "nearest" }
                            if (c.includes("gray")) { tmpCls = "gray" }
                            if (c.includes("palette")) { tmpCls = "palette" }
                            if (c.includes("grayscale")) { tmpCls = "grayscale" }

                            c = c.replace("actual-","").replace("grayscale-","").replace("gray-","").replace("palette-","").replace("nearest-","")
                            if ((tmpCls != "gray") && (tmpCls != "grayscale")) {
                                // skip grays
                                colors.push(c)
                            } else {
                                grays.push(c)
                            }
                        }
                    }
                }

                // show prediction
                let aTA = [...new Set(predict)]
                
                let aCOL = [...new Set(colors)]
                let aGRAY = [...new Set(grays)]
                let aSEARCH = [...new Set(search_tags)]

                var aEmojis = getEmojisFromTags(img.id, predict)

                var ret = {}
                ret.emojis = aEmojis.sort()
                ret.tags = aTA
                ret.colors = aCOL
                ret.grays = aGRAY
                ret.search = aSEARCH
                ret.conf = captionConfirmPrediction(img, ret.emojis)
                ret.conf = ret.conf.sort()
 
                return ret
            }
        }

        function updateCaption(cls) {
            if (cls) {
            var tmp = cls.replace("BLIP-","")
            var aTmp = tmp.split("-")
            var content = aTmp[0]

            var ta_textarea = document.getElementById("guess")
            var ta_val = ta_textarea.innerHTML

            var predcapt_el = document.getElementById("predict-caption")
            //console.log("setting caption element to: " + caption)

            // Match caption to caption
            //var caption_matches = captionMatchesCaption(img)
            //console.log("CAPTION MATCH")
            //console.log(caption_matches)

            var first_caption = tmp.replace(/-/g," ")
            //var second_caption = caption

            //predcapt_el.innerHTML = '<p class="first-caption">A <input type="checkbox" name="caption" id="caption-A" value="A"> <label for="caption-A">' + first_caption + '</label></p><p class="second-caption">B <input type="checkbox" name="caption" id="caption-B" value="B"> <label for="caption-B">' + second_caption + '</label></p>'

            if (first_caption) {
                // console.log("CLS: " + cls)
                predcapt_el.innerHTML = '<p class="first-caption"><label for="caption-A">' + first_caption + '</label></p>'
            } else {
                predcapt_el.innerHTML = ''
            }
          }
        }

        var lastconf = ""
        function updateConfirmedPrediction(preds) {

            var con_el = document.getElementById("confirmed")
            if (!(preds.join(" ") == lastconf)) {
                con_el.value = preds.join(" ")
            }

            lastconf = con_el.value
        }

        function getEmojisFromTags(which, tags) {
            // convert text to emojis
            var emoji_output = []
            for (var i = 0; i < tags.length; i++) {
                var tmp = tags[i]
                var emoji = findEmoji(tmp)
                if (emoji) {
                    //aTA[i] = emoji
                    emoji_output.push(emoji)

                    // tag image with emoji
                    //var emoji_cls = "emoji_" + emoji

                    //console.log("Tag with emoji: " + emoji)
                    //tagImage(which, emoji_cls)
                }
            }

            // create a unique set
            //let ret = [...new Set(emoji_output)]
            ret = emoji_output
            return ret
        }

        function flipCard(pos, emoji) {
            alert('flip card!')
            var card = String.fromCodePoint(0x1F3B4)

            var flip = document.getElementById("flipped")
            var txt = flip.innerHTML
            var tmp = []
            if (txt = "") {
                for (var i=0; i <= pos; i++) {
                    if (i == pos) {
                        tmp.push(emoji)
                    } else {
                        tmp.push(card)
                    }
                }
            }

            flip.innerHTML = tmp.join(" ")

            alert(card)
            alert(emoji)
        }

        function findEmoji(keyword) {
            var ret = ""
            if (emojis) {                
                for (var i = 0; i < emojis.length; i++) {
                    var emu = emojis[i]
                    const [key] = Object.keys(emu)

                    if (key == keyword) {
                        ret = emu[keyword]
                    }
                }
            }
            //console.log("Find Emoji: " + ret)
            return ret
        }

        function fullyLoaded() {
            // everything is finally ready!

            //$(".loading #loading-spinner").hide()
            $(".loading #loading-loaded").show()
            //$(".loading #loading-continue").show()

            // $(".loading").hide()
        }

        
        var watchBuffer
        var refill = 0
        function fillScreen() {
            
            // clear screen
            windowScreen.innerHTML = "" // make sure it's empty
            
            var ready = 0
            if (!(refill)) {
                watchBuffer = setInterval(function() {
                    if (ready <= SCREEN_SIZE) {
                        ready = 0 // recount
                        $(".test .tagged").each(function() {
                            ready++
                        })
                    } else {
                        // no refills
                        console.log("READY: " + ready)

                        var count = 0
                        $(".test .tagged").each(function() {
                            if (count <= SCREEN_SIZE) {
                                var tmp = $(this)
                                tmp.addClass("move")
                                //tmp.remove()

                            }
                            count++
                        })

                        $(".move").each(function() {
                            console.log("MOVE BITCH")
                            var tmp = $(this)
                            windowScreen.append(this)

                            $(this).removeClass("move")
                        })

                        fullyLoaded()
                        clearWatcher(watchBuffer)
                        refill = 1
                    }
                }, 500)
            } else {
                // no refills!
                clearWatcher(watchBuffer)
            }
        }

        function clearWatcher(timer) {  clearInterval(timer) }

        function getImages(num = 0, buffer = windowBuffer) {
            // load a buffer of images to test
            var aBatch = []
            aBatch = generateRandomImages(num)
            
            for (var i = 0; i < aBatch.length; i++) {
                // build image
                var img = new Image()

                img.onload = function() {
                    // begin image testing
                    testImage(event.target.id)
                }

                var item = aBatch[i]
                var path = buildImageHTML(item)   

                img.id = "img-" + path.id
                img.src = path.thumbnail
            
                // build link
                var a = document.createElement('a')
                a.href = "javascript: clickImage('" + path.id + "')"
                a.id = path.id
                
                // add image to link
                a.appendChild(img)

                // add to test buffer
                buffer.appendChild(a)

                // add event listener to start image testing
                /* var docImg = document.getElementById(img.id)
                docImg.addEventListener('load', (event) => {
                    testImage(event.target.id)
                }) // no longer necessary due to fixing the broken code above 
                */ 
            
            }
            
        }

        
        // on image load test the image
        function testImage(which) {
            var img = document.getElementById(which)

            if (img) {
                // thumbnails from imgur are square
                if (img.height != img.width) { 
                    // delete image if blank
                    //console.log("Delete image: " + which)
                    $(img).parent().addClass("predict_404")
                }
                //} else {

                    // tags have been applied and will follow the image as it moves
                    var dad = $(img).parent()
                    dad.addClass("tagged")
                        
                    // Setup tests
                    console.log("Run tests on image: " + which)
                    
                    var del = dad.hasClass("predict_404")

                    if (!(del)) {
                        // don't run these bots on 
                        // images that will get deleted
                        //caption(which)
                        //snailBot(which) 
                        //faceBot(which)
                        //objectBot(which)
                        //cocoBot(which)
                        //ocrBot(which)

                        BLIPworker(which)
                        YOLOworker(which)
                        CAPTIONworker(which)
                        SNAILworker(which)
                        FACEworker(which)
                        OCRworker(which)                    
                    }

                    // run these bots anyway
                    //metaBot(which)
                    METADATAworker(which, username)

                //}
            }

        }

        function trackAdImage(which, url) {
            //alert(url)
        }

        function clickImage(which) {
            console.log('Image clicked: ' + which)

            var el, iid, url
            var htmlID = which
            if (!(which.includes("ad-"))) {
                if (which.includes("pd-")) {
                    // public domain 
                    url = "https://img.window-to-the-world.org/public_domain/img/" + which.replace("pd-","")

                    el = document.getElementById(which)
                    iid = which.replace("pd-","img-")
                } else {
                    htmlID = "img-" + which
                    var tmp = document.getElementById(htmlID)

                    var cls = $("#img-" + which).prop('class')
                    //alert(cls)

                    var imgur = which.replace("img-","")
                    url = "https://i.imgur.com/" + imgur + ".jpg"

                    iid = "img-" + which
                    el = document.getElementById(iid)
                }
            } else { 
                // it's an ad
                url = "https://img.window-to-the-world.org/img/" + which.replace("ad-","")
                el = document.getElementById(which)
                iid = which.replace("ad-","img-")
            }
            

            if ((iid != "screen") && (el)) {
                var cls = el.className
                console.log("Zoom image: " + iid)
                console.log("Advertisement? " + cls.includes("advertisement"))

                if (cls.includes("advertisement")) {
                    // handle ads differently
                    trackAdImage(which, url)

                } 
                
                // make predictions
                tagImage(iid, "user_zoom predict_zoom predict_delete ")
                //tagImage(iid, "predict_like predict_dislike predict_superlike ")
                // ^ duplicate tags will be ignored

                // prediction is confirmed
                if (cls.includes("user_zoom")) { 
                    tagImage(iid, "user_zoom-1") 
                    tagImage(iid, "predict_zoom-confirm")
                }
                if (cls.includes("user_zoom-1")) { 
                    tagImage(iid, "user_zoom-2") 
                }
                if (cls.includes("user_zoom-2")) { 
                    tagImage(iid, "user_zoom-many") 
                }

                // show image to user
                //var imgur = iid.replace("img-","")
                //var url = "https://i.imgur.com/" + imgur + ".jpg"
                zoomImage(which, url)
            
            }
            //deleteImage(which)
        }

        // Advance the tape:
        // move a tested image from buffer to history
        // from position 0,0 every interval (speed * 1000ms)
        var deleteCount = 0
        function moveTapeLeft(num) {
            var count = 0
            console.log("Move tape to the left")

            $("#screen A").each(function() {
                if (count < num) {

                    $(this).addClass("pos-0") // should take as param
                    $(this).addClass("timestamp-" + new Date().getTime() / 1000)
                    windowHistory.append(this)

                    // add to delete count
                    deleteCount++

                }
                count++
            })

            // advance buffer
            var bufferCount = 0
            $("#buffer A").each(function() {
                if (bufferCount == 0) {
                    // first image
                    windowScreen.append(this)
                }
                bufferCount++
            })

            historyOverflow()

            // replace it with a new image
            getImages(ITERATE)

        }

        
        // rewind the tape
        // move the most recent image from history to buffer 
        // and put it into the correct position
        function moveTapeRight(num) {
            var count = 0
            console.log("Move tape to the right")
            $("#history A").each(function() { count++ })

            historyFill()

            // history repeats itself
            var newCount = 0;
            $("#history A").each(function() { 
                if (newCount == (count)) { // -1
                    
                    // remove any other classes
                    $(this).removeClass("faded")
                    $(this).removeClass("user_deleted")

                    // get old position
                    var pos = getTapePositionCls(this)

                    // remove all position classes
                    for (var i = 0; i < SCREEN_SIZE; i++) {
                        var str = "pos-" + i
                        if ($(this).hasClass(str)) {
                            $(this).removeClass(str)
                        }
                    }

                    // remove all timestamp classes
                    for (var i = 0; i < SPEED * 10; i++) {
                        var str = "timestamp-" + i
                        if ($(this).hasClass(str)) {
                            $(this).removeClass(str)
                        }
                    }

                    // insert at that position 
                    //windowScreen.prepend(this)
                    insertAtPosition(this, pos)

                    // refresh a new image from the
                    // database into the buffer
                }
                newCount++
            })

        }

        function insertAtPosition(img, pos) {
            // count positions
            var cnt = 0
            var aPos = []

            // build an array for quick lookup
            $("#screen A").each(function() { 
                aPos.push(this)
                cnt++ 
            })

            // get the image from the next array
            var nextImage = aPos[pos]

            // move it on to the screen
            windowScreen.insertBefore(img, nextImage)

        }

        function getTapePosition(which) {
            var cnt = 0
            var ret = 0
            tape = windowScreen

            //var img = document.getElementById(which)

            if (tape) {
                $("#screen A").each(function() {                     
                    if (which == this.id) {
                        console.log("Position: " + cnt)
                        ret = cnt
                    }
                    cnt++
                })
            }

            return ret
        }

        function getTapePositionCls(img) {
            console.log("Get tape position from image: " ) 

            var ret = 0
            for (var i = 0; i < SCREEN_SIZE; i++) {
                var str = "pos-" + i

                if ($(img).hasClass(str)) {
                    ret = i
                }
            }

            return ret
        }

        function getCurrentImage(elem = windowScreen) {
            var ret
            if (elem) {
                var a = elem.getElementsByTagName("a")
                var el = a[0]

                if (el) {
                    var imgs = el.getElementsByTagName("img")
                    var img = imgs[0]

                    if (img) {
                        ret = img.id
                    }
                }
            }

            return ret
        }

        function getImageByPos(pos, elem = windowScreen) {
            var ret
            if (elem) {
                var a = elem.getElementsByTagName("a")
                var el = a[pos - 1]

                if (el) {
                    var imgs = el.getElementsByTagName("img")
                    var img = imgs[0]

                    if (img) {
                        ret = img.id
                    }
                }
            }

            return ret
        }

        function skipCurrentImage() {
            var img = getCurrentImage()

var yolo = document.getElementById('yolo')
yolo.innerHTML = ""

            var pc = document.getElementById('predict-caption')
            pc.innerHTML = ""

            if (img) {
                console.log("Skip image: " + img)
                tagImage(img, "user_skip")
            }
           
            moveTapeLeft(1)

            // reset timer
            clearWatcher(pageTimer)
            startPageTimer()
        }

        function reviewLastImage() {
            moveTapeRight(1)

            // reset timer
            clearWatcher(pageTimer)
            startPageTimer()
            
            var img = getCurrentImage()
            if (img) {
                console.log("Review image: " + img)
                tagImage(img, "user_review")
            }
        
        }

        function dislikeCurrentImage() {
            var img = getCurrentImage()

            // tag with dislike
            if (img) {
                console.log("Dislike image: " + img)
                tagImage(img, "user_dislike")
            }
            
            // delete image
            var a = windowScreen.getElementsByTagName("a")            
            var el = a[0]
            if (el) {
                //deleteImage(el.id)
            }
        }

        function superlikeCurrentImage() {
            var img = getCurrentImage()
            if (img) {

                console.log("Superlike image: " + img)
                tagImage(img, "user_superlike")
            }
        }

        function likeCurrentImage() {
            var img = getCurrentImage()
            if (img) {
                console.log("Like image: " + img)
                tagImage(img, "user_like")
            }

            //moveTapeLeft(1)
        }


        function deleteImage(which, auto = false) {
            console.log("User delete: " + which)
            
            var dad
            var img = document.getElementById(which)
            dad = document.getElementById("img-" + which)

            if (!(dad)) {
                // Addy Warbucks
                dad = document.getElementById(which.replace("img-","ad-"))
            }

            // save position data
            var cls = "pos-" + getTapePosition(which)
            var id = $(img).attr('id')

            tagImage(id, cls)

            // note that the user took the action
            tagImage(id, "user_deleted-true")
            tagImage(id, "timestamp-" + new Date().getTime() / 1000)

            // confirm the prediction
            var imgClass = dad.className
            if (imgClass.includes("predict_delete")) {
                // this should be tag image not add class
                tagImage(id, "predict_delete-confirm")
            }

            // delete and add to count
            if (!(auto)) {
                windowHistory.append(img)
            } else {
                // only move to history if it's showing
                var cur = getCurrentImage()
                cur = cur.replace("img-","").replace("ad-","")
                var tmpID = id.replace("img-","").replace("ad-","")

                if ((tmpID = cur) || (imgClass.includes("predict_shown"))) {
                    windowHistory.append(img)
                } else {
                    img.remove()
                }

                // get an extra one for auto delete
                getImages(1)
            }

            deleteCount++

            // advance buffer
            var bufferCount = 0
            $("#buffer A").each(function() {
                if (bufferCount == 0) {
                    // first image
                    windowScreen.append(this)
                }
                bufferCount++
            });

            // refill
            getImages(ITERATE)
        }


        // UTILITY FUNCTIONS

        var pageTimer, fadeOut
        function startPageTimer() {

            // fade out
            fadeOut = setInterval(function() {
                var screenCount = 0;
                $("#screen A").each(function() { 
                    if (screenCount == 0) {
                        $(this).addClass("faded")
                    }
                    screenCount++
                })
            }, ((SPEED - .5) * 1000))

            // move tape left
            pageTimer = setInterval(function() {
                moveTapeLeft(1)
            }, SPEED * 1000)
        }

        function hideLoading() { 
            $("#modal").fadeOut(500)
            console.log("Get out the way")

            // start timer
            startPageTimer()
        }


        // get a random filename for Imgur
        function generateRandomFilename() {
            var length = 5 // potentially randomize

            var result           = ''
            var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            var charactersLength = characters.length

            for ( var i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength))
            }

            return result
        }

        
        // generate a batch of random file names
        function generateRandomImages(num = iterate) {
            var ret = []

            // generate [num] filenames to test
            for (var i = 0; i < num; i++) {
                ret.push(generateRandomFilename())
            }
            
            // set the global initialized flag 
            if (!(initialized)) { initialized = true }

            return ret
        }
        
        function buildImageHTML(filename, ads=false) {
            var img = {}
            img.id = filename 
            img.url = "https://i.imgur.com/" + filename + ".jpg"
            img.thumbnail = "https://i.imgur.com/" + filename + "b.jpg"
            img.ad = false

            return img
        }

        
        function getAdvertisement() {
            // get the current user?
            var img = {}
            var url = "/ice9/"
            
            // cloudy with a chance of ads
        
            console.log("Requesting advertisement from ad server")

            // serve an advertisement
            $.ajax({
                url: url,
                type: "GET",
                dataType:'json',
                catch: function(error) {
                    console.log(error)
                },
                success: function(data) {
                    console.log("Received advertisement")
            
                    var jsonData = data
                    //console.log(jsonData)

                    if (jsonData) {

                        console.log("Data: " + jsonData)
                        var img = new Image()
                        var img_id = "img-" + jsonData.ad

                        img.onload = function() {
                            console.log("Testing advertisement: " + img_id)
                            testImage(img_id)
                        }
                        img.id = img_id
                        img.src = "https://img.window-to-the-world.org/tn/" + jsonData.ad
                        img.className = "ad"
                    
                        // build link
                        var a = document.createElement('a')
                        a.href = "javascript: clickImage('" + img_id.replace("img-","ad-") + "')"
                        a.id = "ad-" + jsonData.ad
                        a.className = "advertisement"

                        // add image to link
                        a.appendChild(img)

                        // add to test buffer
                        //console.log(a)
                        windowScreen.appendChild(a)

                    }
                }
            })
            
        }

        function tagImage(img, tags) {
            var image
            var aTags = []

            if (img) {
                image = document.getElementById(img)

                if (image) {
                    if (tags) {
                        aTags = tags.split(" ")

                        if (aTags.length > 1) {
                            // multipass
                            for (var i = 0; i < aTags.length -1; i++) {
                                var tag = aTags[i]
                                if (tag) {
                                    if (image.classList) {
                                        image.classList.add(tag)
                                    } else {
                                        tagImage(image, tag)
                                    }
                                }
                            }
                        } else {
                            // single tag
                            var tag = aTags[0]
                            if (tag) {
                                if (image.classList) {
                                    image.classList.add(tag)
                                } else {
                                    tagImage(image, tag)
                                }
                            }
                        }
                    }
                }
            }
        }

        function historyFill() {
            console.log("Fill history")

            // check buffer for length, push extra entries to database
            var cnt = 0
            if (deleteCount > 0) {
                //retrieveLastItem(user)
                deleteCount--
            }

            if (deleteCount < 0) { deleteCount = 0 }

            retrieveLastItem()

        }

        // manage buffers so the app doesn't crash the browser
        function historyOverflow() {
            console.log("History Overflow")

            // check buffer for length, push extra entries to database
            var cnt = 0
            $("#history A").each(function() {
                if (cnt > (SCREEN_SIZE * BUFFER_SCREENS)) { // three pages
                    // delete for now
                    // push to database later
                    var arr = [$(this).id] // this is dumb

                    //var imgData = buildDataModel(this.id)
                    //saveImage(imgData)

                    // remove first item
                    removeFirstItem()
                    cnt = 0
                }
                cnt++
            })
        }

        function retrieveLastItem() {
            console.log("Get last item from the database")
            // get most recent item from the database
            user = "demo" // this is hard coded, do not change! // not anymore!!
            var url = "/retrieve/retrieve.php?user=" + username                               

            // create an anchor tag 
            // to help with lag
            var placeholderID = uuidv4()
            var a = document.createElement('a')
            a.href = "#" + placeholderID
            a.id = placeholderID
            a.className = "recovered"

            // append it before running the request
            windowHistory.prepend(a)

            $.ajax({
                url: url,
                type: "GET",
                dataType:'json',
                success: function(data){            
                    var jsonData = data                    
                    // console.log(jsonData)

                    if (jsonData) {
                        //console.log("JSON Data!")

                        for (var i = 0; i < jsonData.length; i++) {
                            // iterate through because it came from the database
                            var obj = jsonData[i]

                            //console.log(obj)

                            var json_win = obj // JSON.parse(win)

                            //console.log(json_win)

                            //var idat = win.image_data
                            var bin = json_win.binary_image_data
                            //console.log("Image Data: " + idat)
                            //console.log("Binary Image Data: " + bin)

                            if (bin) {

                                //console.log("BINARY")
                                //console.log(bin.toString())

                                //console.log("BASE64")

                                var bin64 = decodeURI(atob(bin))
                                
                                //console.log(bin64)

                                // strip quotes
                                var html = bin64.substring(1, bin64.length - 1)

                                // find the anchor we added earlier
                                var findA = document.getElementById(placeholderID)

                                var append = false
                                if (!(findA)) {
                                    // placeholder can't be found
                                    append = true
                                    findA = document.createElement("a")
                                }
                                findA.href = "javascript: clickImage('" + json_win.file.name + "')"

                                // append the content
                                findA.innerHTML = bin64

                                // update the ID
                                findA.id = json_win.file.name

                                if (append) {
                                    windowHistory.append(findA)
                                }
                            }
                        
                            

                        // insert into buffer in the last position
                        // append
                        }

                    }  
                }
            });

            /* $.get(url, function(data, status){
                
            }) */
                
        }

        function removeFirstItem() {
            // saves a nested loop, maybe?
            cnt = 0

            $("#history A").each(function() {
                if (cnt == 0) {
                    var imgData = buildDataModel(this.id)

                    saveImage(imgData)
                    $(this).remove()
                }
                cnt++
            })
        }

        function saveImage(dataModel) {
            if (dataModel) {
                $.ajax({
                    url: "/save/index.php",
                    type: "POST",
                    dataType:'json',
                    data: { "img": JSON.stringify(dataModel) },
                    success: function(data){
                                
                        console.log("POST DATA TO DATABASE")
                        console.log(dataModel)
                        console.log(data)
                    }
                })
            }
        }

        function uuidv4() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
        }

        function deDupeArray(arr) {
            var unique = [...new Set(arr)]
            return unique
        }

        var lastDM
        function buildDataModel(which) {
            console.log("Build data model: ")

            var param = which // why though?
            var jqStr = which // "#img-" + param.id
            
            var tmp = document.getElementById("img-" + which)
            if (!(tmp)) {
                tmp = document.getElementById("ad-" + which)
            }

            var img = tmp //[0]

            //console.log(img)
            if (img) {
                var clsList = img.classList
                var alt = img.alt

                var model = {}

                var avm = {}
                var del = {}
                var user = {}
                var file = {}
                var meta = {}
                var obj = {}
                var multi = {}
                var facecnt = 0
                var color = {}
                var palette = []
                var grayscale = []
                var txt = []
                var emojis = []
                var predict = []
                var actions = []
                var tags = []
                var caption = []

                // get predictions in json format
                var preds = updatePrediction(img)
                if (preds) {
                    // get emojis from predictions
                    emos = preds.emojis
                    
                    if (emos) {
                        for (var i = 0; i < emos.length; i++) {
                            var tmp = emos[i]
                            var emo = tmp.codePointAt(0).toString(16)
                            emojis.push(emo)
                        }
                    }

                    // final predicted tags
                    if (preds.tags) {
                        tags = preds.tags
                    }
                }

                model.guid = uuidv4()
                model.timestamp = new Date().getTime() / 1000
                model.ad = false

                console.log('build binary')
                var bin = document.getElementById(which) //param.id
                //console.log(bin.addClass("saved"))

                //model.image_data = encodeURI(bin.innerHTML)
                model.binary_image_data = btoa(encodeURI(bin.innerHTML))

                user.name = "local" //session.name // replace later
                user.email = "local" //session.email

                var tmp = buildImageHTML(which)
                file.name = which
                file.url = tmp.url
                file.thumbnail = tmp.thumbnail

                // get position and timestamp from link 
                var anchor = document.getElementById(which.replace("img-","").replace("ad-",""))
                
                del.action = false // default to false
                var anchorCls = anchor.className.split(/\s+/)
                for (var i = 0; i < anchorCls.length; i++) {
                    var cls = anchorCls[i]
                    console.log(cls)

                    if (cls.includes("advert")) {
                        model.ad = true
                    }

                    if (cls.includes("pos-")) {
                        pos = cls.replace("pos-", "")
                        del.position = pos
                    }

                    if (cls.includes("timestamp-")) {
                        pos = cls.replace("timestamp-", "")
                        del.time = pos
                    }
                    
                    if (cls.includes("user_deleted")) {
                        del.action = true
                    } 

                }

                for (var i = 0; i < clsList.length; i++) {
                    var cls = clsList[i]
                    var tmpCat = cls.split("_")

                    var category = tmpCat[0]                    
                    var cat_val = cls.replace(key, "") // replace the key

                    var keyval = cat_val.split("-")
                    var key = keyval[0]
                    var val = keyval[1]

                    //console.log("Category: " + category)
                    switch (category) {
                        case "meta": 
                            if (key && val) {
                                var tmpKey = key
                                tmpKey = tmpKey.replace("meta_","")
                                
                                meta[tmpKey] = val
                            }
                            break
                        case "color": 
                            if (key && val) {
                                var tmpKey = key
                                tmpKey = tmpKey.replace("color_","")

                                switch (tmpKey) {
                                    case "palette":
                                        palette.push(val)
                                        break
                                    case "grayscale":
                                        grayscale.push(val)
                                        break
                                    default:
                                        color[tmpKey] = val
                                        break
                                }
                            }
                            break
                        case "avm": 
                            if (key && val) {
                                var tmpKey = key
                                tmpKey = tmpKey.replace("avm_","")

                                avm[tmpKey] = parseInt(val) / 100 // probability
                            }
                            break
                        case "object": 
                            if (key && val) {
                                var tmpKey = key
                                tmpKey = tmpKey.replace("object_","")

                                obj[tmpKey] = parseInt(val)
                            }
                            break
                        case "multi": 
                            if (key && val) {
                                var tmpKey = key
                                tmpKey = tmpKey.replace("multi_","")

                                multi[tmpKey] = parseInt(val)
                            }
                            break
                        case "text": 
                            var tmpPal = key.split("_")
                            var tmpVal = tmpPal[1]

                            if (tmpVal) {
                                txt.push(tmpVal)
                            }

                            break
                        case "emoji": 
                            var tmpPal = key.split("_")
                            var tmpVal = tmpPal[1]

                            if (tmpVal) {
                                var emo = tmpVal.codePointAt(0).toString(16)
                                emojis.push(emo)
                            }

                            break
                        case "caption": 
                            var tmpPal = key.split("_")
                            var tmpVal = tmpPal[1]

                            if (tmpVal) {
                                var capt = tmpVal
                                caption.push(capt)
                            }

                            break
                        case "predict": 
                            var tmpPal = key.split("_")
                            var tmpVal = tmpPal[1]

                            if (tmpVal) {
                                predict.push(tmpVal)
                            }

                            break
                        case "user":
                            var tmpPal = key.split("_")
                            var tmpVal = tmpPal[1]

                            if (tmpVal) {
                                actions.push(tmpVal)
                            }

                            break
                        case "faces": 
                        console.log(key)
                        
                            if (key) {
                                var tmpVal = key
                                tmpVal = tmpVal.replace("faces_", "")

                                facecnt = parseInt(tmpVal)
                            }

                            break
                    }
                }

                model.classify = avm
                model.delete = del
                model.file = file
                model.faces = facecnt
                model.meta = meta
                model.objects = obj
                model.multi = multi
                model.color = color
                model.palette = palette
                model.grayscale = grayscale
                model.text = txt
                model.user = user
                
                let modelEmo = [...new Set(emojis)]
                model.emoji = modelEmo // unique

                model.predict = predict
                model.actions = actions

                var modelTags =  [...new Set(tags)]
                model.tags = modelTags
                
                model.caption = alt.replace("caption-","").replace("caption_") // extracted from the caption

                if (model != lastDM) {
                    // don't repeat 
                    //console.log(model)
                }
                
            }

            lastDM = model
            return model
        }
        
        function stopWorker(worker) {
            if (worker) {
                worker.terminate()
                worker = undefined
            }
        }

        var loginTimer
        function testLoginImage(which) {

            setTimeout(function() {
                CAPTIONworker(which)
                SNAILworker(which)
                FACEworker(which)
                OCRworker(which)    
                METADATAworker(which)
            }, 50)

            var preds
            loginTimer = setInterval(function() {
                if (windowModal.style.display != "none") {
                    // only refresh while modal is showing
                    preds = updatePrediction(which)
                }

                var login_predictions = document.getElementById("login_predictions")
                var login_predictions_cls = document.getElementById("login_predictions_cls")

                if (preds) {
                    if (preds.colors) { }
                    if (preds.grays) { }
                    if (preds.emojis) { 
                        var emo = preds.emojis

                        if (emo.length > 0) {
                            $(".loading #loading-spinner").hide()
                            $(".loading #loading-continue").show()
                            login_predictions.innerHTML = emo.join(" ")
                            //clearWatcher(loginTimer)
                        }
                    }
                    if (preds.tags) { 
                        var el = document.getElementById(which)
                        login_predictions_cls.innerHTML = el.classList.length
                    }
                }

                /*if (stopTimer) {
                    clearWatcher(this)
                } */
            }, 1000)   
            
            
            var failover = setTimeout(function() {
                // failover after ten seconds
                $(".loading #loading-spinner").hide()
                $(".loading #loading-continue").show()
                $("#modal").fadeOut(500)
                //clearWatcher(loginTimer)
            }, 20000)
            

        }
        
    </script>
    <script src="https://kit.fontawesome.com/cf2170d77e.js" crossorigin="anonymous"></script>

    <style>

    </style>
  </head>
  <body id="page">

    <?PHP 
    if (isset($_GET["tn"])) {
    ?>
    <div id="modal" class="loading">
        <div class="disclaimer">            
            <h2 id="welcome_back" class="center"></h2>

            <div id="login_predictions">
                <h4>Scanning your Photo</h4>
            </div>
            
            <div id="login_colors"></div>

            <?PHP
            // this should be done in javascript
            $tn = $_GET["tn"];
            
                //$img = '<img id="login_thumbnail" onload="testLoginImage(\'login_thumbnail\')" src="data:image/jpg;charset=utf-8;base64,' . $tn . '" alt="Login thumbnail">';
                $img = '<img id="login_thumbnail" onload="testLoginImage(\'login_thumbnail\')" src="/login/tn/' . $tn . '" alt="Login thumbnail">';
                echo $img;
            ?>
        
            <div id="loading-spinner">
                <p>SCANNING</p>
            </div>

            <div id="loading-loaded">
                <input id="loading-continue" type="button" value="Continue" onclick="javascript: hideLoading();">
            </div>

            <div id="login_predictions_cls"></div>

            <!--
            <h2>Disclaimer:</h2>
            <p>These are not my images. They are randomly loaded from imgur. Because of that they could contain literally anything you can take a picture of. I take no responsibility for these images. They are NOT hosted on this server. They will not be seen by anyone but you and anyone else looking at your screen. To report an image, please report it at Imgur, the source of the data.</p>
            <p>This project is intended to be a filter for these images. As it develops we will add nudity filters and other filters to make this datastream more pleasant to look at. In the meantime, enter at your own risk.</p>
            <p>You must be 18 to continue.</p>

            -->

        </div>
    </div>
    <?PHP } ?>
    <div id="overlay" class="overlay" onclick="hideOverlay()">
        <div id="bkg"></div>
        <div id="img"><img id="preview"></div>
    </div>

    <div id="chantilly"></div>
    <div id="lace"></div>
    <div id="tile"></div>

    <div id="predict">
        <!--<h2>Predictions</h2>-->
        <input id="confirmed" readonly>
        <div id="predict-caption"></div>
        <div id="mask"></div>
        <div id="guess"></div>
        <div id="guess-final"></div>
        <div id="guess-from-caption"></div>
        <div id="yolo"></div>
    </div>

    <div id="colors"></div>

    <main>
        <div id="present">
            <div id="buffer" class="test"></div>
            <div id="screen" class="ready"></div>
        </div>
        <div id="past">
            <div id="history" class="delete"></div>
        </div>
    </main>
    
    <nav id="navigation">
        <a id="back" href="javascript: reviewLastImage()"><span>Back</span></a>
        <a id="next" href="javascript: skipCurrentImage()"><span>Next</span></a>
    </nav>

    <nav id="skip">
        <a id="dislike" href="javascript: dislikeCurrentImage()"><span>Dislike</span></a>
        <a id="hot" href="javascript: superlikeCurrentImage()"><span>Superlike</span></a>
        <a id="like" href="javascript: likeCurrentImage()"><span>Like</span></a>
    </nav>

    <script>

        // assign DOM elements to variables
        var windowBuffer = document.getElementById("buffer")
        var windowScreen = document.getElementById("screen")
        var windowHistory = document.getElementById("history")
        var windowDeleted = document.getElementById("deleted")
        var windowModal = document.getElementById("modal")

        var clickTimer // this isn't used. It's meant to collect
                       // the time between end-user clicks
        clickTimer = setInterval(function() {
            clickTimer++
        },100)
        
        // EVENT MANAGEMENT

        // after page load
        $(window).on('load', function(e) {            
            init()

            // there are three of these... I wonder if any of them work
            document.body.addEventListener('touchmove', function(event) {
                //event.preventDefault()
            }, false)
        })

        document.onkeydown = function (event) {
            switch (event.keyCode) {
                case 37:
                    break;
                case 38:
                    // console.log("Up key is pressed.");
                    break;
                case 39:
                    //skipCurrentImage()
                    break;
                case 40:
                    // console.log("Down key is pressed.");
                    break;
            }
        }

        function zoomImage(which, url) {
            // show modal
            var overlay = document.getElementById("overlay")
            var preview = document.getElementById("preview")
            var img = document.getElementById("img")
            
            img.style.backgroundImage = 'url("' + url + '")'
            overlay.style.display = "block"

            // asininely check a completely different image
            // nope
            /*
            var image = new Image()
            image.onload = function() {
                // always called
                resizeZoom()
            }
            image.src = url
            preview.src = url // start pre-loading
            */
            //preview.onload = resizeZoom()
        }

        function resizeZoom(url) {
            // this function does not work
            setTimeout(function() {

                var overlay = document.getElementById("overlay")
                var preview = document.getElementById("preview")
                var img = document.getElementById("img")

                var oW = window.innerWidth
                var oH = window.innerHeight

                var iW = preview.width
                var iH = preview.height
                
                var l = (oW - iW)
                var t = (oH - iH)

                if (iW > oW) { iW = iW * .9 }

                l = (iW / 2) * -1
                t = t / 2

                if (t < 0) { t = "5%" }

                console.log(oW + "," + oH)
                console.log(iW + "," + iH)

                console.log("Left: " + l)
                console.log("Top: " + t)

                //$(img).css({ "margin-top": t })
                //$(img).css({ "left": "50%" })
                //$(img).css({ "margin-left": l + "px" })
                
                overlay.style.display = "block"
            }, 400)

        }

        function hideOverlay() { 
            overlay.style.display = "none"
        }

        // zoom image on devices that support it
        $(".ready").contextmenu(function(e) {
            // clickImage(e.target.id)
            /*
            var iid = e.target.id
            var el = document.getElementById(iid)

            if ((iid != "screen") && (el)) {
                var cls = el.className
                console.log("Zoom image: " + iid)
                console.log("Advertisement? " + cls.includes("advertisement"))

                if (cls.includes("advertisement")) {
                    // handle ads differently
                } else {
                    
                    // make predictions
                    tagImage(iid, "user_zoom predict_zoom predict_delete ")
                    // ^ duplicate tags will be ignored

                    // prediction is confirmed
                    if (cls.includes("user_zoom")) { 
                        tagImage(iid, "user_zoom-1") 
                        tagImage(iid, "predict_zoom-confirm")
                    }
                    if (cls.includes("user_zoom-1")) { 
                        tagImage(iid, "user_zoom-2") 
                    }
                    if (cls.includes("user_zoom-2")) { 
                        tagImage(iid, "user_zoom-many") 
                    }

                    // show image to user
                    var imgur = iid.replace("img-","")
                    var url = "https://i.imgur.com/" + imgur + ".jpg"
                    zoomImage(url)
                }

                e.preventDefault()
            }
            */
        })

        // clear zoomed image with a keypress for devices that support it
        $(window).keyup(function(e) {
            clearInterval(pageTimer)
            clearInterval(fadeOut)
        })
        
        $(window).keyup(function(e) {
            // functions are backwards
            // because the UI changed and they need
            // to be renamed...
            if ((e.key === "ArrowLeft") || (e.key === "a")) {
                moveTapeRight(1)
            }

            if ((e.key === "ArrowRight") || (e.key === "d")) {
                moveTapeLeft(1)

            }

            if (e.key === "Escape") { // escape key maps to keycode `27`
                hideOverlay()
            }

            startPageTimer()
        })

        // disable scrolling for mobile devices
        window.ontouchstart = function(e) { e.preventDefault() }
        document.body.addEventListener('touchmove', function(e){ e.preventDefault(); });
        window.addEventListener("scroll", preventMotion, false);
        window.addEventListener("touchmove", preventMotion, false);

        function preventMotion(event)
        {
            window.scrollTo(0, 0);
            event.preventDefault();
            event.stopPropagation();
        }

    </script>
    <!-- required by coco and obj -->
    <script src="bots/prefs.js"></script>
    <script src="bots/prefs_color.js"></script>
    <script src="bots/prefs_meta.js"></script>
    <script src="bots/classify.js"></script>
    <script src="bots/public_domain.js"></script>
    <script src="bots/backpropagate.js"></script>

    <!-- load bots individually (can be batched up) -->
    <script src="bots/snail.js"></script>
    <script src="bots/caption.js"></script>
    <script src="bots/blip.js"></script>
    <script src="bots/yolo.js"></script>
    <script src="bots/coco.js"></script>
    <script src="bots/color.js"></script>
    <script src="bots/faces.js"></script>
    <script src="bots/metadata.js"></script>
    <script src="bots/object.js"></script>
    <script src="bots/ocr.js"></script>
    <script src="bots/ocr_worker.js"></script>

    <!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-NDG79XR7R6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-NDG79XR7R6');
</script>
  </body>
</html>

<?PHP 
/*
 } else {
    header("Location: /login");
 }
*/
?>
