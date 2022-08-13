
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

function snailBot(which) {
    console.log("SnailBot: " + which)

    var tagStr = ""

    var el = buildImageHTML(which.replace("img-",""))
    var url = "/snail/snail.php?img=" + el.url                                
    $.get(url, function(data, status){
        var jsonData
        
        if (data) {
            jsonData = JSON.parse(data);
        }

        if (jsonData) {
            var colors = jsonData.colors
            var palette = jsonData.palette
            var grayscale = jsonData.grayscale

            var tagStr = ""
            if (colors) {
                for (var key in colors) {
                    var val = colors[key]

                    tagStr += "color_"
                    tagStr += key // key
                    tagStr += "-" // separator
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            }      

            if (palette) {
                for (var key in palette) {
                    var val = palette[key]

                    tagStr += "color_palette-"
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            }   
            
            if (grayscale) {
                for (var key in grayscale) {
                    var val = grayscale[key]

                    tagStr += "color_grayscale-"
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            } 

            // apply tags to image
            console.log("Adding tags: " + tagStr)
            tagImage(which, tagStr)

        }  
    })


    tagStr = ""
}
