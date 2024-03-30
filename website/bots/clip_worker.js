onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("CLIP worker message received: " + event.data)
    clip(event.data)
}

function clip(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    //var url = "http://192.168.0.32/yolo/?img=" + which //.replace("b.jpg","l.jpg")
    var url = "/CLIP/?img=" + which //.replace("b.jpg","l.jpg")

    console.log("CLIP worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("CLIP worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    let data = await response.text()

    var jsonData
    if (response.body) {
        //console.log(data)
        //jsonData = JSON.parse(data)
        jsonData = data
    }

    if (jsonData) {
            
        var jsonData                    
        if (response.body) {
            jsonData = JSON.parse(data)
            //jsonData = data
        }

        output_tags = ""
        if (jsonData) {
            var clip = jsonData
            //console.log(tags)
            var tagStr = ""

            if (clip) {
                var ret = []

                for (var i in clip) {
                    var obj = clip[i]
                    //console.log(obj)
                    var tag = obj[0].keyword
                    var emo = obj[1].emoji
                    var conf = obj[2].confidence * 1000
                    
                    // console.log("CLIP: " + tag + "," + emo + "," + conf)
                    tag = tag.replace(" ","-").toLowerCase()

                    if (tag) {
                        tagStr = "CLIP_" + tag + "-" + conf
                        ret.push(tagStr)
                    }

                    if (emo) {
                        tagStr = "CLIPemoji_" + emo
                        ret.push(tagStr)
                    }

                }

                // remove duplicates
                ret_set = new Set(ret)

                // and return
                output_tags = Array.from(ret_set).join(",")
                postMessage(output_tags)

                tagStr = ""
            }
        }
    }
}

