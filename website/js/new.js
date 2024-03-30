
// on image load test the image
function testImage(which) {
    console.log("TEST IMAGE: " + which)

    var img = document.getElementById(which.replace("img-","")) // fixes parent issue below

    if (img) {
        var p = img.parentNode

        // thumbnails from imgur are square
        if (img.height != img.width) { 
            // delete image if blank
            //console.log("Delete image: " + which)
            p.classList.add("predict_404")
        }
        //} else {

            // tags have been applied and will follow the image as it moves
            p.classList.add("tagged")
                
            // Setup tests
            console.log("Run tests on image: " + which)
            
            var del = p.classList.contains("predict_404")

            which = which.replace("tn/thumb.","")
            // collect metadata in all cases
            METADATAworker(which, username)

            if (!(del)) {
                // don't run these bots on 
                // images that will get deleted
                OBJECTworker(which, username) // SSD
                //COCOworker(which, username)
                //CAPTIONworker(which)
                BLIPworker(which)
                CLIPworker(which)
                DETECTRONworker(which)
                INCEPTIONworker(which)
                LLAMAworker(which)
                SNAILworker(which)
                FACEworker(which)
                NSFWworker(which)
                OCRworker(which)                
                YOLOworker(which)
            }

        //}
    }

}

function updatePrediction_old(img) {
    //console.log("UPDATE PREDICTION")
    //console.log(img)

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
        img = document.getElementById(img)
    }
    
    if (img) {
        // get the image
        var clss = img.className
        //console.log(clss)

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

                if (cls.includes("inception_")) {
                    var tmp = cls.replace("inception_","")
                    var aTmp = tmp.split("-")
                    var obj = aTmp[0]
                    var conf = aTmp[1]

                    objects_combined.push(obj)

                    if (conf == maxconf_multi) {
                        search_tags.push(obj)
                        predict.push(obj) // + "-" + conf

                        /* if (conf > target_conf) {
                            predict.push(obj) // + "-" + conf
                        } */
                    }
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
                    if (c.includes("primary")) { tmpCls = "primary" }
                    if (c.includes("nearest")) { tmpCls = "nearest" }
                    //if (c.includes("gray")) { tmpCls = "gray" }
                    if (c.includes("palette")) { tmpCls = "palette" }
                    //if (c.includes("grayscale")) { tmpCls = "grayscale" }

                    c = c.replace("primary-","").replace("grayscale-","").replace("gray-","").replace("palette-","").replace("nearest-","")
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
        //let aGRAY = [...new Set(grays)]
        let aSEARCH = [...new Set(search_tags)]

        var aEmojis = getEmojisFromTags(img.id, predict)

        var ret = {}
        ret.emojis = aEmojis.sort()
        ret.tags = aTA
        ret.colors = aCOL
        //ret.grays = aGRAY
        ret.search = aSEARCH

        var ccp = captionConfirmPrediction(img, ret.emojis, guessJSON)
        ret.conf = ccp
        //ret.conf = ret.conf.sort()
        
        //console.log(ret)
        return ret
    }
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


function getCaptionFromTags(img) {
    var ret = {}

    // make sure it's an HTML object
    if ((typeof img) == "string") {
        img = document.getElementById(img)
    }

    if (img) {
        // loop through classes and extract captions
        var cls = img.className

        if (cls) {
            var aCls = cls.split(" ")
            for (var i = 0; i < aCls.length; i++) {
                var clss = aCls[i]

                if (clss.includes("caption_")) {
                    // python captioner
                    var tmp = clss.replace("caption_","").replace(/-/g," ").replace(/_/g," ").trim()
                    ret.caption = fixCommonProblems(tmp)
                }

                if (clss.includes("BLIP-")) {
                    var tmp = clss.replace("BLIP-","").replace(/-/g," ").replace(/_/g," ")
                    ret.BLIP = fixCommonProblems(tmp)
                }

                if (clss.includes("YOLO-")) {
                    var tmp = clss.replace("YOLO-","").replace(/-/g," ").replace(/_/g," ").trim()
                    ret.YOLO = fixCommonProblems(tmp)
                }
            }
        }
    }

    return ret
}

function captionConfirmPrediction(img, emojis_from_image, guessJSON) {
    // even though this seems redundant, doing it the "correct"
    // way kills performance, so don't do that

    //console.log(emojis_from_image)

    if (!(guessJSON)) {
        guessJSON = {}
    }

    var confirmed = []
    var confirmed_emojis = []

    var caption_from_image = getCaptionFromTags(img)

    caption = caption_from_image.caption
    yolo7 = caption_from_image.YOLO
    blip = caption_from_image.BLIP

    if (img) {
        var cn = ""
        if (img.className) { cn = img.className }

        image_tags = cn.split(" ")

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

        if (caption || blip || yolo7) {
            
            //combined_caption = img.alt + " " + img.title + " " + yolo7// append title to alt to compare both 
            combined_caption = caption + " " + blip + " " + yolo7

            var object_tags = []
            
            var emojis_from_alt = emojisFromCaption(caption)
            var emojis_from_title = emojisFromCaption(blip)
            var emojis_from_yolo= emojisFromCaption(yolo7)

            var emojis_from_caption = []
            emojis_from_caption = emojis_from_caption.concat(emojis_from_alt)
            emojis_from_caption = emojis_from_caption.concat(emojis_from_title)
            emojis_from_caption = emojis_from_caption.concat(emojis_from_yolo)
            
            //console.log("EMOJIS FROM CAPTION")
            //console.log(emojis_from_caption)

            var final_el = document.getElementById("guess-final") // first
            var guess_el = document.getElementById("guess") // guessJSON.all
            var cpt_el = document.getElementById("guess-from-caption") // second?

            // what the actual fuck
            //var cpt_val = (guess_el.innerHTML + " " + emojis_from_caption.join(" ")).replace(","," ")
            var objs = ""
            if (guessJSON) {
                if (guessJSON.objects) {
                    objs = guessJSON.objects.join(" ")
                }
            }
            var cpt_val = (objs + " " + emojis_from_caption.join(" ")).replace(","," ")

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

            //final_el.innerHTML = first_place
            //cpt_el.innerHTML = second_place

            // collect object and multi tags from the image
            for (var i = 0; i < image_tags.length; i++) {
                var t = image_tags[i]

                if (t.includes("object") || (t.includes("multi")) || (t.includes("inception"))) {
                    t = t.replace("object_","").replace("multi_","").replace("inception_")

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
                confirmed_emojis.push("🧑")
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
    // var guess_el = document.getElementById("guess")
    // var guess = guess_el.innerHTML

    // from JSON instead o fHTML element
    var guess = []
    if (guessJSON) {
        if (guessJSON.objects) {
            guess = guessJSON.objects.join(" ")
        }
    }
    if ((!(guess)) || (guess === "undefined")) { guess = "" }

    var final = []
    
    //console.log("CONFIRMED")
    //console.log(confirmed_emojis)

    //guess_el.innerHTML = ""
    //guess_el = guess + confirmed_emojis

    for (var i = 0; i < confirmed_emojis.length; i++) {
        var cnf = confirmed_emojis[i]

        var tmp = " "

        if (guess) {
            tmp = guess
        }

        if (tmp.includes(cnf)) {
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

    var confirmBLIP = []
    var confirmedBLIP = []
    if (img) {
        if (blip) {
            //console.log("CONFIRM BLIP: " + img.alt)
            //confirmBLIP = emojisFromCaption(img.alt)

            for (var i = 0; i < confirmBLIP.length; i++) {
                var blipemo = confirmBLIP[i]
                
                for (var ii = 0; ii < final_ns.length; ii++) {
                    var finalemo = final_ns[ii]

                    if (blipemo === finalemo) {
                        confirmedBLIP.push(blipemo)
                    }
                }
            }

            //console.log("CONFIRMED BLIP")
            //console.log(confirmBLIP)
            //console.log(final_ns)
            //console.log(confirmedBLIP)

            //pred_capt_el = document.getElementById("predict-caption")
            //pred_capt_el.innerHTML = pred_capt_el.innerHTML + " [" + confirmedBLIP.length + "]" 
        }

    }


    // build JSON for output

    var all = (guess + confirmed_emojis).split(",")
    all = all.concat(emojis_from_caption)

    guessJSON.all = all

    if (first_place) {
        guessJSON.first = first_place.split(" ")
    } else {
        guessJSON.first = []
    }

    if (first_place) {
        guessJSON.second = second_place.split(" ")
    } else {
        guessJSON.second = []
    }

    return guessJSON
}

function cleanArray(actual) {
    var newArray = new Array()
    for (var i = 0; i < actual.length; i++) {
        if ((actual[i]) && (actual[i] != "")) {
            newArray.push(actual[i])
        }
    }
    return newArray
}

