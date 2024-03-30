onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Object Worker message received: " + event.data)
    objBot(event.data)
}

function objBot(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/object/?img=" + which //.replace("b.jpg",".jpg")
    console.log("Object Worker fetching url: " + url)
    
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("Object Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var output_tags = []

    let data = await response.text()
    //console.log(data)

    var jsonData                    
    if (response.body) {
        jsonData = JSON.parse(data)
        //jsonData = data
    }

    if (jsonData) {
        var tags = jsonData
        //console.log(tags)
        var tagStr = ""
        if (tags) {
            for (var i in tags) {
                var tag = tags[i]

                var tmpVal = tag.confidence
                var obj = tag.object
                var emo = tag.emoji

                if (obj) {
                    conf = 0
                    if (tmpVal) { 
                        //conf = Math.round(tmpVal)
                        conf = tmpVal.toFixed(3) * 1000
                        conf = conf.toString()
                    }
    
                    tagStr += "object_"
                    tagStr += obj.toLowerCase() // key
                    tagStr += "-" // separator
                    tagStr += conf //.replace("/ /g","_").replace("[","-").replace("]","").replace("'","") // value
                    tagStr += " "
                }

                if (emo) {
                    tagStr += "ObjectEmoji_" + emo + " "
                }
            }

            // add tags         
            if (tagStr != "")  {
                console.log("Object Worker Adding tag: " + tagStr)
                output_tags.push(tagStr)
                //tagImage(which, tagStr)
                //nsfw(which, tagStr.replace("/ /g",",").replaceAll("object_",""))
            }                 

            postMessage(output_tags)

            tagStr = ""
        }
    }
    
    aImages = ""
    
}
