function emojisFromCaption(caption) {
    var emojis_from_caption = []

    if ((caption) && (caption !== "undefined")) {
        caption = caption.replace("background","") // manually filter out the word "background"

        var aCaption = caption.split(" ")
        aCaption = [...new Set(aCaption)]
    
        for (var i = 0; i < aCaption.length; i++) {
            var word = aCaption[i]
            var emoji = findEmoji(pluralize.singular(word))
            if (emoji) {
                emojis_from_caption.push(emoji)
            }
        }
    }

    return emojis_from_caption
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


function fixCommonProblems(caption) {
    // manually...
    var ret = caption

    if (caption) {
        ret = ret.replace("hot dog", "hotdog").replace("hot-dog", "hotdog")
        ret = ret.replace("teddy bear", "teddybear").replace("teddy-bear", "teddybear")
    }

    return ret
}

function getCaptionFromTags(img) {
    var ret = {}

    // make sure it's an HTML object
    if ((typeof img) == "string") {
        img = document.getElementById(img)
    }

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

    return ret
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

function buildDataModel(which) {
    console.log("Build data model: ")

    var param = which // why though?
    var jqStr = which // "#img-" + param.id
    
    var tmp = document.getElementById("img-" + which)
    if (!(tmp)) {
        tmp = document.getElementById("ad-" + which)
    }

    var img = tmp //[0]

    var caption_from_image = getCaptionFromTags(which)

    //console.log(img)
    if (img) {
        var clsList = img.classList

        var model = {}

        var avm = {}
        var del = {}
        var user = {}
        var file = {}
        var meta = {}
        var obj = {}
        var multi = {}
        var inception = {}
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
        //var anchorCls = anchor.className.split(/\s+/)
        for (var i = 0; i < anchor.classList.length; i++) {
            var cls = anchor.classList[i]

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
                case "inception": 
                    if (key && val) {
                        var tmpKey = key
                        tmpKey = tmpKey.replace("inception_","")

                        inception[tmpKey] = parseInt(val)
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
        model.inception = inception
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
        
        //model.caption = alt.replace("caption-","").replace("caption_") // extracted from the caption
        // caption now contains blip, yolo, and caption
        model.caption = caption_from_image

        if (model != lastDM) {
            // don't repeat 
            //console.log(model)
        }
        
    }

    lastDM = model
    return model
}

function updatePrediction(img) {
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

        var ccp = captionConfirmPrediction(img, ret.emojis, guessJSON)
        ret.conf = ccp
        //ret.conf = ret.conf.sort()
        
        return ret
    }
}
