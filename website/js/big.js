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
    console.log(emojis)
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

function cleanArray(actual) {
    var newArray = new Array()
    for (var i = 0; i < actual.length; i++) {
        if ((actual[i]) && (actual[i] != "")) {
            newArray.push(actual[i])
        }
    }
    return newArray
}

function removeLast(word, char){
    var tmp = word.split("")
    tmp[word.lastIndexOf(char)] = ""
    return tmp.join("")
}

function processActions(action_tags) {
    actions_json = []

    var keyword, timestamp
    for (var i in action_tags) {
        tmp_json = {}

        tag = action_tags[i]
        tag = tag.replace("action_","")
        aAction = tag.split("-")

        for (var ii in aAction) {
            tmp_tag = aAction[ii]
            if (isNaN(tmp_tag)) {
                keyword = tmp_tag
            } 
        }
        tmp_json.keyword = keyword
        tmp_json.timestamp = Date.now()

        actions_json.push(tmp_json)
    }

    return actions_json
}

function processBLIP(blip_tags) {
    blip_json = []

    for (var i in blip_tags) {
        blip = blip_tags[i]
        blip = blip.replace("blip_","").replace("|","")
        blip = mergeCommonWords(blip)
        blip = replaceWords(blip)

        aBLIP = blip.split(" ")
        for (var ii in aBLIP) {
            word = aBLIP[ii]

            tmp_json = {}
            if (!(banned_words.includes(word))) {
                tmp_json.keyword = pluralize.singular(word)

                // lookup emoji
                emo = lookupEmoji(tmp_json.keyword)
                tmp_json.emoji = emo

                //tmp_json.confidence = -1 // no confidence ratings from BLIP
                blip_json.push(tmp_json)
            }
        }

    }

    return blip_json
}

function processLlama(llama_tags) {
    llama_json = []

    for (var i in llama_tags) {
        llama = llama_tags[i]
        llama = llama.replace("llama_","").replace("|","")
        llama = mergeCommonWords(llama)
        llama = replaceWords(llama)

        aLLAMA = llama.split(" ")
        for (var ii in aLLAMA) {
            word = aLLAMA[ii]

            tmp_json = {}
            if (!(banned_words.includes(word))) {
                tmp_json.keyword = pluralize.singular(word)

                // lookup emoji
                emo = lookupEmoji(tmp_json.keyword)
                tmp_json.emoji = emo

                //tmp_json.confidence = -1 // no confidence ratings from BLIP
                llama_json.push(tmp_json)
            }
        }

    }

    return llama_json
}

function processCLIP(clip_tags) {
    clip_json = []

    var keyword, conf
    for (var i in clip_tags) {
        tmp_json = {}
        tag = clip_tags[i]

        tag = tag.replace("clip_","")
        aCLIP = tag.split("-")

        for (var ii in aCLIP) {
            word = aCLIP[ii]
            if (isNaN(word)) {
                keyword = pluralize.singular(word)
                emo = lookupEmoji(keyword)

            } else {
                conf = parseInt(word) / 1000
            }
        }
        tmp_json.keyword = keyword
        tmp_json.confidence = conf
        tmp_json.emoji = emo

        clip_json.push(tmp_json)
    }

    return clip_json
}


function processColors(colors) {
    var colors_json = {}
    var pal = []

    for (var i in colors) {
        color = colors[i]

        // primary
        if (color.startsWith("color_primary-")) {
            color = color.replace("color_primary-","#")
            colors_json.primary = color
        }

        // palette
        if (color.startsWith("color_palette-","#")) {
            color = color.replace("color_palette-","#")
            pal.push(color)
        }
    }

    let colorset = [...new Set(pal)]
    colors_json.palette = colorset

    return colors_json
}


function processDetectron(detectron_tags) {
    detectron_json = []
    tags = []

    let tmp_tags = [...new Set(detectron_tags)]

    for (var i in tmp_tags) {
        var tmp = {}

        tag = tmp_tags[i]
        tags = tag.toLowerCase().split("-")

        var word = ""
        var conf = 0
        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("detectron_","")
            
            if (isNaN(tmp_tag)) {
                tmp_tag = tmp_tag.trim()
                word = word + "_" + tmp_tag
                emo = lookupEmoji(tmp_tag)
            } else {
                // is a number
                conf = tmp_tag
            }

        }

        // merge word if split by hyphens
        //console.log(word)
        word = removeLast(word, "_")
        word = mergeCommonWords(word)

        tmp.keyword = pluralize.singular(word)
        tmp.confidence = parseInt(conf) / 1000
        tmp.emoji = emo

        // lookup emoji and add it here
        detectron_json.push(tmp)
    }

    //console.log(detectron_json)
    return detectron_json
}


function processFaces(face_tags) {
    face_json = {}
    tags = []
    val = -1

    //console.log(inception_tags)
    for (var i in face_tags) {
        tag = face_tags[i]
        tags = tag.toLowerCase().split("-")

        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("faces_","")

            if (!(isNaN(tmp_tag))) {
                // is a number
                val = parseInt(tmp_tag)
            }
        }
    }

    return val
}

function processInception(inception_tags) {
    inception_json = []
    tags = []

    let tmp_tags = [...new Set(inception_tags)]

    //console.log(inception_tags)
    for (var i in tmp_tags) {
        var tmp = {}

        tag = tmp_tags[i]
        tags = tag.toLowerCase().split("-")

        var word = ""
        var conf = 0
        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("inception_","")
            
            if (isNaN(tmp_tag)) {
                tmp_tag = tmp_tag.trim()
                word = word + "_" + tmp_tag
                emo = lookupEmoji(tmp_tag)
            } else {
                // is a number
                conf = tmp_tag
            }

        }
        word = removeLast(word, "_")

        // merge word if split by hyphens
        //console.log(word)
        word = mergeCommonWords(word)
        tmp.keyword = pluralize.singular(word)
        tmp.confidence = parseInt(conf) / 1000
        tmp.emoji = emo

        // lookup emoji and add it here
        inception_json.push(tmp)
    }

    //console.log(inception_json)
    return inception_json
}


function processMeta(meta_tags) {
    meta_json = []
    tags = []

    let tmp_tags = [...new Set(meta_tags)]

    for (var i in tmp_tags) {
        var tmp = {}

        tag = tmp_tags[i]
        tags = tag.split("-")

        key = tags[0]
        key = key.replace("meta_","")
        val = tags[1]

        switch (key) {
            case ("filesize"):
                val = val / 100 + " MB"
                break
            case ("entropy"):
                val = parseFloat(val) / 1000
                /*
                entropy = entropy.toString().split("")
                entropy.splice(1, 0, ".")
                entropy = entropy.join("")
                val = parseFloat(entropy)
                */

                break
            case ("aspect"):
                val = val / 1000
                break
            default:
                break
        }

        tmp[key] = val

        // lookup emoji and add it here
        meta_json.push(tmp)
    }

    //console.log(detectron_json)
    return meta_json

}

function processNSFW(nsfw_tags) {
    nsfw_json = {}
    tags = []
    val = -1

    //console.log(inception_tags)
    for (var i in nsfw_tags) {
        tag = nsfw_tags[i]
        tags = tag.toLowerCase().split("-")

        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("nsfw_","")

            if (!(isNaN(tmp_tag))) {
                // is a number
                val = parseInt(tmp_tag) / 1000
            }
        }
    }

    return val
}

function processObject(obj_tags) {
    obj_json = []
    tags = []

    let tmp_tags = [...new Set(obj_tags)]

    for (var i in tmp_tags) {
        var tmp = {}

        tag = tmp_tags[i]
        tags = tag.toLowerCase().split("-")

        var word = ""
        var conf = 0
        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("object_","")
            
            if (isNaN(tmp_tag)) {
                tmp_tag = tmp_tag.trim()
                word = word + "_" + tmp_tag
                emo = lookupEmoji(tmp_tag)
            } else {
                // is a number
                conf = tmp_tag
            }

        }

        // merge word if split by hyphens
        //console.log(word)
        word = removeLast(word, "_")
        word = mergeCommonWords(word)

        tmp.keyword = pluralize.singular(word)
        tmp.confidence = parseInt(conf) / 1000
        tmp.emoji = emo

        // lookup emoji and add it here
        obj_json.push(tmp)
    }

    //console.log(detectron_json)
    return obj_json

}


function processOCR(ocr_tags) {
    ocr_json = {}
    tags = []
    val = ""

    //console.log(inception_tags)
    for (var i in ocr_tags) {
        tag = ocr_tags[i]
        tags = tag.toLowerCase().split("-")

        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("ocr_","")

            if (isNaN(tmp_tag)) {
                // is a number
                val = tmp_tag.replace(/-/g," ")
            }
        }
    }

    return val
}

function processYOLO(yolo_tags) {
    yolo_json = []
    tags = []

    let tmp_tags = [...new Set(yolo_tags)]

    //console.log(inception_tags)
    for (var i in tmp_tags) {
        var tmp = {}

        tag = tmp_tags[i]
        tags = tag.toLowerCase().split("-")

        var word = ""
        var conf = 0
        for (var ii in tags) {
            tmp_tag = tags[ii]
            tmp_tag = tmp_tag.replace("yolo_","")
            
            if (isNaN(tmp_tag)) {
                tmp_tag = tmp_tag.trim()
                word = word + "_" + tmp_tag
                emo = lookupEmoji(tmp_tag)
            } else {
                // is a number
                conf = tmp_tag
            }

        }

        // merge word if split by hyphens
        //console.log(word)
        word = removeLast(word, "_")
        word = mergeCommonWords(word)

        tmp.keyword = pluralize.singular(word)
        tmp.keyword = tmp.keyword.trim()
        tmp.confidence = parseInt(conf) / 1000
        tmp.emoji = emo

        // lookup emoji and add it here
        yolo_json.push(tmp)
    }

    //console.log(yolo_json)
    return yolo_json
}

function processPredict(prefs_tags) {
    //console.log("PREDICT")
    //console.log(prefs_tags)
    var predict_tags = []
    var tags = []
    ret = ""

    let tmp_tags = [...new Set(prefs_tags)]

    //console.log(inception_tags)
    for (var i in tmp_tags) {
        var tmp = {}

        tag = tmp_tags[i]
        tags = tag.toLowerCase().split("_")

        for (var ii in tags) {
            tmp_tag = tags[ii]
            if ((tmp_tag != "predict") && (tmp_tag != "prefs")) {
               ret = tmp_tag
            }
        }

        // lookup emoji and add it here
    }

    //console.log(yolo_json)
    return ret
}

function processVotes(votes_tags) {
    var votes_json = {}
    var votes_first = []
    var votes_second = []

    for (var i in votes_tags) {
        vote = votes_tags[i]
        tmp_tag = vote.replace("votes_","").toLowerCase()

        if (tmp_tag.startsWith("first")) {
            tmp = tmp_tag.replace("first-","")
            //console.log(tmp)
            tmp = toUnicode(tmp)
            votes_first.push(tmp)
        }
    
        if (tmp_tag.startsWith("second")) {
            tmp = tmp_tag.replace("second-","")
            //console.log(tmp)
            tmp = toUnicode(tmp)
            votes_second.push(tmp)

        }
    }
    
    votes_json.first = votes_first
    votes_json.second = votes_second

    //console.log(votes_first)
    //console.log(votes_second)
    //console.log(votes_json)
    return votes_json
}

function lookupEmoji(keyword) {
    ret = ""

    for (var i in emoji_list) {
        item = emoji_list[i]
        key = Object.keys(item)
        val = item[key]

        if (keyword == key) {
            ret = toUnicode(val)
        }
    }

    return ret
}

function collectEmojis(json) {
    var emos = []

    for (var i in json) {
        tmp_json = json[i]
        emo = tmp_json.emoji

        if (emo && emo != "") {
            emos.push(fromUnicode(emo))
        }
    }

    return emos
}

function updatePrediction(preds) {
    var total_emojis = []
    var blip_emojis = []
    var clip_emojis = []
    var detectron_emojis = []
    var face_emojis = []
    var inception_emojis = []
    var llama_emojis = []
    var object_emojis = []
    var ocr_emojis = []
    var nsfw_emojis = []
    var yolo_emojis = []

    // Get emojis from blip
    blip_emojis = collectEmojis(preds.blip)
    total_emojis = total_emojis.concat(blip_emojis)

    // Get emojis from clip
    clip_emojis = collectEmojis(preds.clip)
    total_emojis = total_emojis.concat(clip_emojis)

    // Get emojis from detectron
    detectron_emojis = collectEmojis(preds.detectron)
    total_emojis = total_emojis.concat(detectron_emojis)

    // Get emojis from NSFW (manual)
    if (preds.faces > 0) {
        //for (var i = 0; i < preds.faces; i++) { // this doesn't work because of multiple faces
        face_emojis.push('&#x1F642')
    }
    total_emojis = total_emojis.concat(face_emojis)

    // Get emojis from inception
    inception_emojis = collectEmojis(preds.inception)
    total_emojis = total_emojis.concat(inception_emojis)

    // Get emojis from llama
    llama_emojis = collectEmojis(preds.llama)
    total_emojis = total_emojis.concat(llama_emojis)
    
    // Get emojis from NSFW (manual)
    if (preds.nsfw > .5) {
        nsfw_emojis.push("🚫")
    }
    total_emojis = total_emojis.concat(nsfw_emojis)
    
    // Get emojis from SSD
    object_emojis = collectEmojis(preds.object)
    total_emojis = total_emojis.concat(object_emojis)

    // Get emojis from OCR (manual)
    if (preds.ocr != "") {
        nsfw_emojis.push("💬")
    }
    total_emojis = total_emojis.concat(ocr_emojis)
    
    // Get emojis from YOLO
    yolo_emojis = collectEmojis(preds.yolo)
    total_emojis = total_emojis.concat(yolo_emojis)

    // Tally emojis
    total_emojis.sort()
    var emoji_counts = {}
    for (var i = 0; i < total_emojis.length; i++) {
        emoji_counts[total_emojis[i]] = 1 + (emoji_counts[total_emojis[i]] || 0)
    }

    sorted = sortEmojis(emoji_counts) 
    return sorted
}

function sortEmojis(emoji_counts) {

    const keyArray = Object.keys(emoji_counts)
    const emojis_sorted = keyArray.sort((a, b) => {
        if (emoji_counts[a] < emoji_counts[b]) {
            return 1
        }
        return -1
    })

    emojis_final = []
    for (i in emojis_sorted) {
        sorted = emojis_sorted[i]
        for (ii in emoji_counts) {
            key = ii //Object.keys(emoji_counts[ii])
            val = emoji_counts[ii]
            if (key == sorted) {
                tmp = {}
                
                tmp[key] = val
                emojis_final.push(tmp)
                //console.log("FINAL")
                //console.log(tmp)    
            }
        }
    }
    //console.log(emojis_final);

    //return emojis_sorted

    //console.log(emoji_counts)
    return emojis_final //emoji_counts
}

function tallyVotes(emoji, preds) {
    var votes = []
    var emojis = ""
    
    if ((preds.faces > 0) && (emoji == "🙂")) {
        votes.push("Face")
    }

    if ((preds.nsfw > .35) && (emoji == "🚫")) {
        votes.push("NSFW")
    }

    if ((preds.ocr != "") && (emoji == "💬")) {
        votes.push("OCR")
    }

    emojis = collectEmojis(preds.blip)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("BLIP")
        }
    }
    //console.log(emoji)

    emojis = collectEmojis(preds.clip)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("CLIP")
        }
    }

    emojis = collectEmojis(preds.detectron)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("Detectron")
        }
    }

    emojis = collectEmojis(preds.inception)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("Inception")
        }
    }

    emojis = collectEmojis(preds.llama)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("LLaMa")
        }
    }

    emojis = collectEmojis(preds.object)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("SSD")
        }
    }

    emojis = collectEmojis(preds.yolo)
    for (var i in emojis) {
        if (emoji == emojis[i]) {
            votes.push("YOLO")
        }
    }

    //console.log(votes)
    voteset = [...new Set(votes)]
    return voteset
}

function stripHTML(html){
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
 }

function matchCaption(caption, model) {
    const regex = /\p{Extended_Pictographic}/ug

    var tmp_caption = ""
    var ret_caption = {}
    var caption_score = 0
    var abs_score = 0
    var top_emojis = 0

    model_emojis = collectEmojis(model)

    matched = []
    if (caption) {
        caption = caption.toLowerCase()
        caption = mergeCommonWords(caption)
        caption = replaceWords(caption)

        var aCaption = caption.split(" ")
        aCaption = [...new Set(aCaption)]
    
        for (var i = 0; i < aCaption.length; i++) {
            var word = aCaption[i]
            
            if (!(banned_words.includes(word))) {
                var emo = lookupEmoji(pluralize.singular(word))
                if (emo != "") {
                    emo = fromUnicode(emo)
                    for (var ii in model_emojis) {
                        model_emo = model_emojis[ii]
                        if (emo == model_emo) {
                            tmp = {}
                            tmp.word = word
                            tmp.emoji = emo
                            matched.push(tmp) 
                        }
                    }
                }
            }
        }

        var bCaption = caption.split(" ")
        tmp_caption = caption
        //console.log(matched)
        for (i in bCaption) {
            // loop through words in the caption
            var word = bCaption[i]
            var votes_first = votes.first
            var votes_second = votes.second

            // skip banned words
            if (!(banned_words.includes(word))) {

                for (var ii in matched) {
                    tmp = matched[ii]
                    tmp_word = tmp.word
                    tmp_emo = tmp.emoji

                    if (word == tmp_word) {
                        // word matches
                        for (var iii in votes_first) {
                            // emoji is in the first section
                            vote = votes_first[iii]
                            if (tmp_emo == vote.emoji) {
                                aCapt = tmp_caption.split(" ")
                                for (var c in aCapt) {
                                    tmp = aCapt[c]
                                    if (tmp == word) {
                                        aCapt[c] = tmp.replace(word, '<u title="' + vote.emoji + '">' + word + '</u> ' + vote.emoji + ' ')
                                        abs_score++
                                    }
                                }
                                tmp_caption = aCapt.join(" ").trim()
                                caption_score = caption_score + 1
                                top_emojis++
                            }     
                        }   

                        for (var iii in votes_second) {
                            // emoji is in the second section
                            vote = votes_second[iii]
                            // emoji is in the first section
                            if (tmp_emo == vote.emoji) {
                                aCapt = tmp_caption.split(" ")
                                for (var c in aCapt) {
                                    tmp = aCapt[c]
                                    if (tmp == word) {
                                        aCapt[c] = tmp.replace(word, '<i title="' + tmp_emo + '">' + word + '</i> ' + vote.emoji + ' ')
                                    }
                                }
                                tmp_caption = aCapt.join(" ").trim()
                                caption_score = caption_score - 1 // remove one for second place
                            }     
                        }
                    }
                }
            
            }
        }
    }

    ret_caption.original = caption
    ret_caption.score = caption_score //Math.round((abs_score / top_emojis) * 100)
    //ret_caption.score = (Math.round((abs_score / model_emojis.length) * 100) / 100) * 100 // percent
    //if (isNaN(ret_caption.score)) { ret_caption.score = 0 }
    //if (ret_caption.score > 100) { ret_caption.score = 100 }
    //if (ret_caption.score < 0) { ret_caption.score = 0 }

    ret_caption.emojis = model_emojis
    ret_caption.caption = tmp_caption

    return ret_caption
}

function finalVoteTally(emoji_counts, preds) {
    votes = {}
    first = []
    second = []
    
    idx = 0
    for (var i in emoji_counts) {
        
        emoji = emoji_counts[i]
        key = Object.keys(emoji)
        vote_count = emoji[key]

        //console.log("Key: " + key + ", " + "Val: " + vote_count)

        tally = tallyVotes(key, preds)

        //console.log("TALLY: ")
        //console.log(tally)

        tmp = {}
        tmp.emoji = key
        tmp.votes = vote_count
        tmp.bots = tally.join(",")

        //console.log(tmp)
        
        if (idx == 0) {
            // first guess is always promoted
            first.push(tmp)
        } else {
            // two votes from two different bots can override
            if ((idx < 2) && ((vote_count >= 2) && (tally.length >= 2))) {
                // second guess only if more than 1 bot voted for it
                first.push(tmp)
            } else {
                // three votes from three bots can override
                if ((idx < 3) && ((vote_count >= 2) && (tally.length >= 2))) {
                    first.push(tmp)
                } else {
                    if ((idx >= 3) && ((vote_count >= 3) && (tally.length >= 3))) {
                        first.push(tmp)
                    } else {
                        second.push(tmp)
                    }
                        
                }
            }
        }
        idx++
    }

    votes.first = first
    votes.second = second

    return votes
}

function buildTallyHTML(tally) {
    //console.log(tally)
    var emoji_span = document.createElement("span")

    var bots = tally.bots.split(",")
    emoji_span.classList.add("emoji")
    emoji_span.classList.add("votes-" + bots.length)
    emoji_span.title = tally.votes + " Votes from " + bots.length + " Bots: " + tally.bots //"Votes: " + count
    emoji_span.style.cursor = "default"
    emoji_span.innerHTML = tally.emoji // + ": " + val
    emoji_span.innerHTML = emoji_span.innerHTML.trim()

    return emoji_span
}

function clearHTML(data, img) {

    var final_el = document.getElementById("guess-final") // first
    var guess_el = document.getElementById("guess-second") // guessJSON.all
    var cpt_el = document.getElementById("guess-from-caption") // second?

    guess_el.innerHTML = "" 
    cpt_el.innerHTML = ""
    final_el.innerHTML = ""
}

function updateHTML(emoji_counts, preds) {
    tally = finalVoteTally(emoji_counts, preds)

    var final_el = document.getElementById("guess-final") // first
    var guess_el = document.getElementById("guess-second") // guessJSON.all
    var cpt_el = document.getElementById("guess-from-caption") // second?

    var div_BLIP = document.getElementById("caption-BLIP")
    var div_LLAMA = document.getElementById("caption-LLAMA")
    //console.log(emoji_counts)

    var caption = preds.caption
    caption_BLIP = caption.blip
    matched_BLIP = matchCaption(caption_BLIP, preds.blip, tally)

    caption_LLAMA = caption.llama
    matched_LLAMA = matchCaption(caption_LLAMA, preds.llama, tally)

    div_BLIP.innerHTML = matched_BLIP.caption
    div_LLAMA.innerHTML = matched_LLAMA.caption

    if (matched_BLIP.score == matched_LLAMA.score) {
        if ((matched_BLIP.score / matched_BLIP.caption.length) < (matched_LLAMA.score / matched_LLAMA.caption.length)) {
            cpt_el.innerHTML = matched_BLIP.caption
        } else {
            cpt_el.innerHTML = matched_LLAMA.caption
        }
    } else {
        if (matched_BLIP.score > matched_LLAMA.score) {
            cpt_el.innerHTML = matched_BLIP.caption

        } else {
            cpt_el.innerHTML = matched_LLAMA.caption
        }
    }
    
    var votes_first = votes.first
    for (var i in votes_first) {
        vote = votes_first[i]

        vote_tag = "votes_first-" + vote.emoji //+ vote.bots.split(",").join("-") + "-"

        //vote_tag = "vote_" + vote.bots.split(",").join("-") + "-" + vote.emoji
        tagImage(preds.file.id, vote_tag)

        emoji_span = buildTallyHTML(vote)
        final_el.appendChild(emoji_span)
    }

    var votes_second = votes.second
    for (var i in votes_second) {
        vote = votes_second[i]
        vote_tag = "votes_second-" + vote.emoji //+ vote.bots.split(",").join("-") + "-"
        //vote_tag = "vote_" + vote.bots.split(",").join("-") + "-" + vote.emoji
        tagImage(preds.file.id, vote_tag)

        emoji_span = buildTallyHTML(vote)
        guess_el.appendChild(emoji_span)
    }
        
    // update colors
    var col = document.getElementById("colors") // textarea
    
    // create html from colors
    var htmlColors = []
    col.innerHTML = ""
    if (preds.colors) {
        //console.log(preds.colors)
        var tmpCls = ""
        var clr = preds.colors
        var aColors = []
        aColors = clr.palette
        
        //console.log(aColors)

        for (var i in aColors) {
            var c = aColors[i]
            colorspan = document.createElement("span")
            colorspan.innerHTML = "&nbsp;"
            colorspan.classList.add("color")
            //colorspan.classList.add(tmpCls)
            colorspan.style.backgroundColor = c

            //var div = '<span class="color' + tmpCls + '" style="background-color: #' + c + '"></span>'
            //console.log(div)

            col.appendChild(colorspan)
            htmlColors.push(colorspan) // div
        }
    }
}


function updateVotesHTML(emoji_counts, preds) {
    tally = finalVoteTally(emoji_counts, preds)
    
    var votes_first = votes.first
    for (var i in votes_first) {
        vote = votes_first[i]

        vote_tag = "votes_first-" + vote.emoji //+ vote.bots.split(",").join("-") + "-"

        //vote_tag = "vote_" + vote.bots.split(",").join("-") + "-" + vote.emoji
        tagImage(preds.file.id, vote_tag)
    }

    var votes_second = votes.second
    for (var i in votes_second) {
        vote = votes_second[i]
        vote_tag = "votes_second-" + vote.emoji //+ vote.bots.split(",").join("-") + "-"
        //vote_tag = "vote_" + vote.bots.split(",").join("-") + "-" + vote.emoji
        tagImage(preds.file.id, vote_tag)
    }
        
}

function packageEmojisModel(model) {
    tmp_emojis = []
    model_emojis = []

    tmp_emojis = collectEmojis(model.blip)
    model_emojis = model_emojis.concat(tmp_emojis)

    tmp_emojis = collectEmojis(model.clip)
    model_emojis = model_emojis.concat(tmp_emojis)

    tmp_emojis = collectEmojis(model.detectron)
    model_emojis = model_emojis.concat(tmp_emojis)

    tmp_emojis = collectEmojis(model.inception)
    model_emojis = model_emojis.concat(tmp_emojis)

    tmp_emojis = collectEmojis(model.llama)
    model_emojis = model_emojis.concat(tmp_emojis)

    tmp_emojis = collectEmojis(model.object)
    model_emojis = model_emojis.concat(tmp_emojis)

    tmp_emojis = collectEmojis(model.yolo)
    model_emojis = model_emojis.concat(tmp_emojis)

    if (model.nsfw > .5) {
        tmp_emojis = ["🚫"]
        model_emojis = model_emojis.concat(tmp_emojis)
    }

    if (model.ocr != "") {
        tmp_emojis = ["💬"]
        model_emojis = model_emojis.concat(tmp_emojis)
    }

    for (var i in model_emojis) {
        model_emojis[i] = toUnicode(model_emojis[i])
    }

    model_emojis = [...new Set(model_emojis)] // remove duplicates
    return model_emojis
}

function buildDataModel(which) {
    var model = {}
    var action_tags = []
    var blip_tags = []
    var clip_tags = []
    var detectron_tags = []
    var face_tags = []
    var inception_tags = []
    var llama_tags = []
    var meta_tags = []
    var nsfw_tags = []
    var object_tags = []
    var ocr_tags = []
    var yolo_tags = []
    var colors_tags = []
    var votes_tags = []
    var predict_tags = []

    // in case the whole image comes through or doesn't
    if ((typeof which) == "string") {
        img = document.getElementById(which)
    }

    if (img) {

        if (img.className) {
            // get the image
            var clss = img.className
            //console.log(clss)
    
            if (clss) {
                var aCls = clss.split(" ")
                for (var i in aCls) {
                    cls = aCls[i]
                    cls = cls.toLowerCase()
                    //console.log(cls)
                    if (cls.startsWith("action_")){
                        action_tags.push(cls)
                    }
    
                    if (cls.startsWith("color_primary") || (cls.startsWith("color_palette"))) {
                        colors_tags.push(cls)
                    }
    
                    if (cls.startsWith("blip_")){
                        blip_tags.push(cls)
                    }
    
                    if (cls.startsWith("clip_")){
                        clip_tags.push(cls)
                    }
    
                    if (cls.startsWith("detectron_")){
                        detectron_tags.push(cls)
                    }
    
                    if (cls.startsWith("faces_")){
                        face_tags.push(cls)
                    }
    
                    if (cls.startsWith("inception_")){
                        inception_tags.push(cls)
                    }

                    if (cls.startsWith("llama_")){
                        llama_tags.push(cls)
                    }
    
                    if (cls.startsWith("meta_")){ 
                        meta_tags.push(cls)
                    }
    
                    if (cls.startsWith("nsfw_")) {
                        nsfw_tags.push(cls)
                    }
    
                    if (cls.startsWith("object_")){ 
                        object_tags.push(cls)
                    }
    
                    if (cls.startsWith("ocr_")){ 
                        ocr_tags.push(cls)
                    }
    
                    if (cls.startsWith("yolo_")){
                        yolo_tags.push(cls)
                    }

                    if (cls.startsWith("votes_")){
                        votes_tags.push(cls)
                    }

                    if (cls.startsWith("prefs_")){
                        predict_tags.push(cls)
                    }
                }
            }
        }
    }

    colors_json = processColors(colors_tags)
    model.colors = colors_json

    // bots 
    model.actions = processActions(action_tags)
    model.blip = processBLIP(blip_tags)
    model.clip = processCLIP(clip_tags)
    model.detectron = processDetectron(detectron_tags)
    model.faces = processFaces(face_tags)
    model.inception = processInception(inception_tags)
    model.llama = processLlama(llama_tags)
    model.metadata = processMeta(meta_tags)
    model.nsfw = processNSFW(nsfw_tags)
    model.object = processObject(object_tags)
    model.ocr = processOCR(ocr_tags)
    model.predict = processPredict(predict_tags)
    model.yolo = processYOLO(yolo_tags)
    model.votes = processVotes(votes_tags)
    model.emojis = packageEmojisModel(model)

    // stamp it
    model.timestamp = Date.now()

    // user info
    var user = {}
    user.name = username
    model.user = user

    // update with file information
    if (img) {
        file = {}
        if (img.id) {
            file.id = img.id
        }
        if (img.src) {
            file.thumbnail = img.src
            tn = img.src
            file.image = tn.replace("tn/thumb.","")
    
        }
        model.file = file
    }

    if (img) {
        caption = {}
        if (img.title) {
            caption.blip = replaceWords(img.title)
        }
        if (img.alt) {
            caption.llama = replaceWords(img.alt)
        }
        model.caption = caption
    }

    //var emos = []
    //emos = getEmojisFromTags(which, keywords)

    //console.log(model)

    return model
}