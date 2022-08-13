// Web worker, multi-threaded
function OCRworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting OCR worker for: ' + which)
            w = new Worker("/bots/ocr_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src
                w.postMessage(url)
            } else {
                console.log("Stopping OCR worker: missing tags")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            
            var tags = event.data
            var tagStr = tags.join(" ")
            if (tagStr) { 
                if (tags != " ") {
                    console.log("OCR Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)
                }
            }

            // get predictions
            var preds = updatePrediction(which)
            console.log("OCR Worker Updating Predictions: ")
            //console.log(preds)
            
            if (preds) {
                var emo_list = preds.emojis
                var emo_tags = []
                // tag with emojis
                for (var i = 0; i < emo_list.length; i++) {
                    var emo = emo_list[i]
                    if (emo) {
                        emo_tags.push(emo)                
                    }    
                }

                console.log("OCR Worker Adding tag: " + emo_tags.join(" "))
                tagImage(which, "emoji_" + emo_tags.join(" "))

                // check preferences
                PREFworker(which)
            }

            
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        ocrBot(which)
    }
}


// older function for single-threaded (older browsers)
function ocrBot(which) {
    //console.log("OCRBot: " + which)

    var tagStr = ""

    //var el = buildImageHTML(which.replace("img-",""))
    var el = document.getElementById(which) 
    var el_url = el.src
    var url = "/ocr/ocr.php?img=" + el_url //.replace("b.jpg",".jpg")

    $.get(url, function(data, status) {
        var jsonData                    
        if (data) {
            jsonData = JSON.parse(data);
        }

        if (jsonData) {
            var tagStr = "ocr-" + jsonData.ocr

            if (jsonData.ocr == "true") {
                var txtTags = jsonData.text
                text = txtTags.replace("@"," ").replace("\\"," ")

                var aTags = txtTags.split(" ")

                for (var i = 0; i < aTags.length; i++) {
                    var text = aTags[i]
                    text = text.replace(" ","") // remove spaces
                    text.replace("/","").replace("\\","").replace("+","").replace("@","").replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')

                    if (text.toString() != "") {
                        var tagStr = ""
                        tagStr += "text_"

                        var trunc_text = "" // limit text to avoid overflow
                        for (var ii = 0; ii < 100; ii++) {
                            if (text[ii]) {
                                trunc_text += text[ii]
                            }
                        }
                        tagStr += trunc_text + " "

                        var runOnce = 0
                        if ((text.length > 2) && i < 1000) { // cap it off
                            if (runOnce == 0) { 
                                tagImage(which, "predict_text")

                                emo = String.fromCodePoint("0x1f524")
                                console.log("Tagging image with: emoji_" + emo)

                                tagImage(which, "emoji_" + emo)
                                runOnce++
                            }

                            console.log("OCR Worker Adding tag: " + tagStr)
                            tagImage(which, tagStr.replace("\\",""))
                        }
                        tagStr = "";
                    }
                    
                }
            }
        }                    
    }) 

}