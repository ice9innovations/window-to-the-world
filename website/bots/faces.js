
// Web worker, multi-threaded
function FACEworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting face worker for: ' + which)
            w = new Worker("/bots/face_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {

                var url = el.src
                w.postMessage(url)
                
            } else {
                console.log("Stopping face worker: missing HTML element")
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var tags = event.data
            var tagStr = tags.join(" ")
            if (tagStr) { 
                if (tags != " ") {
                    console.log("Face Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)

                }
            }
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        faceBot(which)
    }
}