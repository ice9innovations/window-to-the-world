onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("OCR Worker message received: " + event.data)
    ocrBot(event.data)
}

function ocrBot(which) {
    //console.log("OCRBot: " + which)
    var tagStr = ""

    var url = "/tesseract/?img=" + which //.replace("b.jpg",".jpg")
    console.log("OCR Worker fetching url: " + url)
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
        //console.log(jsonData)
    }

    if (jsonData) {
        item = jsonData[0]
        
        if (item.text != "") {
            var txtTags = item.text
            text = txtTags.replace("@"," ").replace("\\"," ").replace("\n"," ")

            var aTags = txtTags.split(" ")
            var tagged = false
            textStr = ""
            for (var i = 0; i < aTags.length; i++) {
                var text = aTags[i]
                text = text.toString()
                text = text.replace(/_/g, "") // remove underscores
                text = text.replace(/ /g,"-") // replace spaces with dashes
                text.replace("/","").replace("\\","").replace("+","").replace("@","").replace(/[`~!@#$%^&*()_|+=?;:'",.<>\{\}\[\]\\\/]/gi, '')
                console.log ("OCR READ TEXT: " + text)

                if (text.toString() != "") {
                    tagged = true
                    textStr = textStr + text + "-"
                }
            }
            if (textStr != "") {
                console.log("OCR TEXT: " +  textStr)

                var lastDash = textStr.lastIndexOf('-'); // find the last -
                textStr = textStr.substr(0, lastDash);

                tags.push("OCR_" + textStr) // remove trailing hyphen
                console.log("OCR EMOJI: " + item.emoji)
                tags.push("OCRemoji_" + item.emoji)
            }
            tags = [...new Set(tags)]
            postMessage(tags)               

            if (tagged) {
                //console.log("OCR Tagging image with: emoji_" + item.emoji)
            }
        }
    }  
}