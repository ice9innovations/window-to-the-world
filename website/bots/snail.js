
// Web worker, multi-threaded
function SNAILworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting snail worker for: ' + which)
            w = new Worker("/bots/snail_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src
                w.postMessage(url)
            } else {
                console.log("Stopping snail worker: missing HTML element")
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
                    console.log("Snail Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)

                }
            }
        
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        snailBot(which)
    }
}
