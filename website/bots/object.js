
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

                    //prefs(which)
                    //prefs_color(pos3)
                    //prefs_meta(which)

                }
            }

            // Animal, Vegetable, Mineral
            //tagStr = tagStr.replaceAll(" ",",").replaceAll("object_","").replace("predict_","")
            //CLASSIFYworker(which, tagStr)
            
            
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
    }
}
