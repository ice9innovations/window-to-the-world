onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Object Worker message received: " + event.data)
    objBot(event.data)
}

function objBot(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/object/object.php?img=" + which //.replace("b.jpg",".jpg")
    //console.log("Object Worker fetching url: " + url)
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
    }

    if (jsonData) {
        var tags = jsonData.tags

        var tagStr = ""
        if (tags) {
            for (var key in tags) {
                var val = tags[key]
                var tmpVal = val

                if (val) { val = val.toString().toLowerCase() }
                if (tmpVal < 10) { val = "0" + val }

                tagStr += "object_"
                tagStr += key.toLowerCase() // key
                tagStr += "-" // separator
                tagStr += val.replace("/ /g","_").replace("[","-").replace("]","").replace("'","") // value
                tagStr += " "
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