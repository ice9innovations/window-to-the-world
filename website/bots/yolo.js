// Web worker, multi-threaded
function YOLOworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting YOLO worker for: ' + which)
            w = new Worker("/bots/yolo_worker.js")

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
                console.log("Stopping YOLO worker: missing HTML element")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var yolo = event.data
            //console.log(yolo)    

            //console.log("YOLO: Tagging data received - " + yolo)
            //var tagStr = tags.join(" ")
            if (yolo) { 
                if (yolo != " ") {
                    yolo = yolo.split(",")

                    var el = document.getElementById(which)
                    if (el) { 
                        for (var i in yolo) {
                            tag = yolo[i]
                            console.log("YOLO Worker tagging image with: " + tag)
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
