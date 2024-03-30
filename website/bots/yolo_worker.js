onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("YOLO worker message received: " + event.data)
    yolo(event.data)
}

function yolo(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    //var url = "http://192.168.0.32/yolo/?img=" + which //.replace("b.jpg","l.jpg")
    var url = "/yolo/?img=" + which //.replace("b.jpg","l.jpg")

    console.log("YOLO worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("YOLO worker received data")
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
            var yolo = jsonData
            //console.log(tags)
            var tagStr = ""

            if (yolo) {
                var ret = []

                for (var i in yolo) {
                    var obj = yolo[i]
                    var tag = obj.tag
                    var emo = obj.emoji
                    var conf = obj.confidence * 1000
                    tag = tag.replace(" ","-").toLowerCase()

                    if (tag) {
                        tagStr = "YOLO_" + tag + "-" + conf
                        ret.push(tagStr)
                    }

                    if (emo) {
                        tagStr = "YOLOemoji_" + emo
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

