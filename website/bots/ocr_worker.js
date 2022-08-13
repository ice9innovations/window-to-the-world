onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("OCR Worker message received: " + event.data)
    ocrBot(event.data)
}

function ocrBot(which) {
    //console.log("OCRBot: " + which)
    var tagStr = ""

    var url = "/ocr/ocr.php?img=" + which //.replace("b.jpg",".jpg")
    //console.log("OCR Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("OCR Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var tags = []

    let data = await response.text()
    //console.log(data)

    var jsonData                    
    if (response.body) {
        jsonData = JSON.parse(data)
    }

    if (jsonData) {
        var tagStr = "ocr-" + jsonData.ocr

        if (jsonData.ocr == "true") {
            var txtTags = jsonData.text
            text = txtTags.replace("@"," ").replace("\\"," ")

            var aTags = txtTags.split(" ")
            var tagged = false
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
                            //tagImage(which, "predict_text")
                            tags.push("predict_text")

                            emo = String.fromCodePoint("0x1f524")

                            // tagImage(which, "emoji_" + emo)
                            tags.push("emoji_" + emo)
                            tagged = true

                            runOnce++
                        }

                        console.log("Adding tag: " + tagStr)
                        //tagImage(which, tagStr.replace("\\",""))
                        tags.push(tagStr.replace("\\",""))

                    }
                    tagStr = ""

                    tags = [...new Set(tags)]
                    postMessage(tags)
                }
                
            }

            if (tagged) {
                console.log("Tagging image with: emoji_" + emo)
            }
        }
    }  
}