onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("NSFW Worker message received: " + event.data)
    nsfw(event.data)
}

function nsfw(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/nsfw/?img=" + which //.replace("b.jpg",".jpg")
    //console.log("Face Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("NSFW Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var output_tags = []

    let data = await response.text()

    var jsonData                    
    if (response.body) {
        jsonData = JSON.parse(data)
    }

    var output_tags = []
    if (jsonData) {
        //console.log(jsonData)
        if (jsonData) {
            //console.log(jsonData)
            var nsfw = jsonData["nsfw"]
            //console.log (nsfw)

            p = nsfw[0]
            e = nsfw[1]
            //console.log("NSFW probability: " + p)

            //console.log("NSFW Confidence: " + p.confidence)
            prob = Math.round(p.confidence * 1000)
            //console.log("NSFW Confidence: " + prob)
            if (prob < 10) {
                prob = "0" + prob.toString()
            }
            //console.log("NSFW Confidence: " + prob)

            // console.log("Probability: " + prob)
            // console.log("Emoji: " + e.emoji)

            var tagStr = "nsfw_" + prob

            output_tags.push(tagStr)

            if (e.emoji != "") {
                //console.log("NSFW Worker Adding tag: " + tagStr)

                //emoStr = "emoji_" + e.emoji
                //output_tags.push(emoStr)
            }
            

            postMessage(output_tags)

        }   
    }
}
