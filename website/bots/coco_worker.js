onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("COCO Worker message received: " + event.data)
    cocoBot(event.data)
}

function cocoBot(which) {
    //console.log("OCRBot: " + which)
    var tagStr = ""

    var url = "/multi/multi.php?img=" + which //.replace("b.jpg",".jpg")
    //console.log("COCO Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("COCO Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var output_tags = []

    let data = await response.text()
    // console.log(data)

    var jsonData                    
    if (data) { //response.body
        jsonData = JSON.parse(data)
    }

    if (jsonData) {
        var tags = jsonData.tags;

        var tagStr = ""
        if (tags) {
            
            // now run predictions
            var firstObject = tags[0]
            var lastObj = ""
            if (firstObject) {
                lastObj = firstObject.object
            }
            var lastConf = 0
            for (var i = 0; i < tags.length + 1; i++) {
                var t = {}

                if (!(tags[i])) {
                    // blank object
                    t.object = ""
                    t.confidence = 0
                } else {
                    t = tags[i]
                }

                if (t.object && t.confidence) {
                    
                    var obj = t.object
                    var confidence = t.confidence

                    // add the confidence

                    if (obj == lastObj) {
                        // it's the same so add it together
                    } else {
                        var lt = {}
                        if (i > 0) {
                            lt = tags[i - 1]
                        }
                        
                        // calculate confidence
                        //lastConf += confidence

                        var confNum = Math.round(lastConf)
                        var confStr = confNum.toString()
                        if (confNum < 10) { confStr = "0" + confStr }

                        // tag it
                        var key = lastObj.replace(" ","_").toLowerCase()

                        tagStr += "multi_"
                        tagStr += key // key
                        tagStr += "-"; // separator
                        tagStr += confNum // value
                        tagStr += " "
                        
                        lastConf = 0
                    }

                    // better than chance...
                    if ((key == "person") || (key == "people")) {
                        // go ahead and tag it as a person
                        if (confNum >= 90) {
                            output_tags.push("predict_animals")
                            output_tags.push("predict_person")
                            //tagImage(which, "predict_animals")
                            //tagImage(which, "predict_person")
                        }
                    }

                    lastConf += t.confidence
                    lastObj = t.object
                }
                
                if (i >= tags.length) {
                    // calculate confidence
                    //lastConf += confidence

                    var confNum = Math.round(lastConf)
                    var confStr = confNum.toString()
                    if (confNum < 10) { confStr = "0" + confStr }

                    // tag it
                    var key = lastObj.replace(" ","_").toLowerCase()

                    tagStr += "multi_"
                    tagStr += key // key
                    tagStr += "-"; // separator
                    tagStr += confNum // value
                    tagStr += " "
                    
                    lastConf = 0

                }
                       
            }
            
            // add tags              
            if (!(tagStr.includes("multi_-0"))) { //blank
                
                console.log("COCO Worker Adding tag: " + tagStr)

                //tagImage(which, tagStr)
                output_tags.push(tagStr)

            }             
            tagStr = ""

        }
    }
    
    postMessage(output_tags)
    aImages = ""
}