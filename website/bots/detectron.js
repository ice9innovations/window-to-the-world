// Web worker, multi-threaded
function DETECTRONworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting Detectron worker for: ' + which)
            w = new Worker("/bots/detectron_worker.js")

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
                console.log("Stopping Detectron worker: missing HTML element")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("Detectron Worker message received")
            var data = event.data
            //console.log(data)
            //var tagStr = tags.join(" ")
            if (data) { 
                if (data != " ") {
                    for (var i in data) {
                        caption = data[i]

                        aCapt = caption.split("|")

                        // read emojis
                        keyword = aCapt[0]
                        if (aCapt[1]) {
                            conf = parseFloat(aCapt[1]) * 1000
                            //console.log(conf)
                        }

                        if (aCapt[2]) {
                            emojis = aCapt[2]
                            if (emojis) {
                                aEmo = emojis.split(",")
                                for (var i = 0; i < aEmo.length; i++) {
                                    emo = aEmo[i]
                                    tmp_tag = "DetectronEmoji_" + emo
                                    console.log("Detectron Worker tagging image with: " + emo)
                                    tagImage(which, tmp_tag)

                                }
                            }
                        }
                        
                        // strip quotes
                        caption = caption.replace(/\"/g,"").replace("\n","")
                        caption = caption.replace(/\'/g,"")

                        // el.title = capt // el.className

                        var tmp_tag = "detectron_" + keyword.replace(/ /g,"-").replace("caption-","") + "-" + conf
                        console.log("Detectron Worker tagging image with: " + tmp_tag)
                        tagImage(which, tmp_tag)
                    
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
