// Web worker, multi-threaded
function CLIPworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting CLIP worker for: ' + which)
            w = new Worker("/bots/clip_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src
                if (url) {
                    w.postMessage(url)
                } else {
                    stopWorker(w)
                }
            } else {
                console.log("Stopping CLIP worker: missing HTML element")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var clip = event.data
            //console.log(yolo)    

            //console.log("YOLO: Tagging data received - " + yolo)
            //var tagStr = tags.join(" ")
            if (clip) { 
                if (clip != " ") {
                    clip = clip.split(",")

                    var el = document.getElementById(which)
                    if (el) { 
                        for (var i in clip) {
                            tag = clip[i]
                            console.log("CLIP Worker tagging image with: " + tag)
                            tagImage(which, tag)
                        }
                    }
                    
                }
            }
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        //caption(which)
    }
}
