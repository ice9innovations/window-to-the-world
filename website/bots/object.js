
function OBJECTworker(which, username) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting object worker for: ' + which)
            w = new Worker("/bots/object_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src
                w.postMessage(url)
            } else {
                console.log("Stopping object worker: missing tags")
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
                    console.log("Object Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)

                    // get preferences
                    var preds = updatePrediction(which)
                    if (preds) {
                        var emo_list = preds.emojis

                        // tag with emojis
                        for (var i = 0; i < emo_list.length; i++) {
                            var emo = emo_list[i]
                            
                            console.log("Object Worker Adding tag: " + emo)
                            tagImage(which, "emoji_" + emo)
                        }

                                    
                        // check preferences
                        PREFworker(which, username)
                    }

                    //prefs(which)
                    //prefs_color(pos3)
                    //prefs_meta(which)

                }
            }

            // Animal, Vegetable, Mineral
            tagStr = tagStr.replaceAll(" ",",").replaceAll("object_","").replace("predict_","")
            CLASSIFYworker(which, tagStr)
            
            
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        objectBot(which)
    }
}

function objectBot(which) {
    //console.log("ObjectBot: " + which)

    var tagStr = ""
    var el = buildImageHTML(which.replace("img-",""))

    var elURL = el.url
    var url = "/object/object.php?img=" + elURL //.replace("b.jpg",".jpg")

    $.get(url, function(data, status){

        if (data) {
            var jsonData = JSON.parse(data)
            //console.log("Data: " + JSON.stringify(jsonData.tags))
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
                    console.log("Adding tag: " + tagStr)
                    tagImage(which, tagStr)
                    //nsfw(which, tagStr.replace("/ /g",",").replaceAll("object_",""))
                    classify(which, tagStr.replace("/ /g",",").replaceAll("object_",""))
                }                 

                tagStr = ""
            }
        }
        
        aImages = ""
    })

}