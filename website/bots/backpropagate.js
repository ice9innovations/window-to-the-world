// Web worker, multi-threaded
function BACKPROPAGATEworker(q, username) {
    var w

    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log("Starting backpropagate worker")
            w = new Worker("/bots/backpropagate_worker.js")

            var tmp = {}
            tmp.q = q
            tmp.usr = username

            if (q && username) {
                w.postMessage(tmp)
            } else {
                console.log("Stopping backpropagate worker: missing data")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            console.log("Backpropagate worker message received")
            var data = event.data

            if (data) {
                jsonData = JSON.parse(event.data)
            
                if (jsonData) {
                    
                    var d = jsonData.image 
                    if (d) {
    
                        if (d.name) {

                            var img = new Image()
                            var img_id = "img-" + d.name
            
                            img.onload = function() {
                                console.log("Testing backpropagate image: " + d.name)
                                testImage(img_id)
                            }
    
                            img.id = img_id
                            img.src = d.thumbnail
                            img.className = "bp"
                        
                            // build link
                            var a = document.createElement('a')
                            a.href = "javascript: clickImage('" + d.name + "')"
                            a.id = d.name
                            a.className = "backpropagate"
            
                            // add image to link
                            a.appendChild(img)
            
                            // add to test buffer
                            console.log("Backpropagate worker appending image to buffer")
                            //console.log(a)
    
                            windowBuffer.appendChild(a)
                        }
                    }
                }
            }

            //console.log("Stopping backpropagate worker: complete")
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        getPublicDomainImage(q)
    }
}


var lastPD = ""
function getBackpropagationEmojis(preds, which) {
    var ret = ""
    
    if (which != lastPD) {
        // don't repeat, saves API calls

        var p
        if (preds) {
            p = preds
        } else {
            p = updatePrediction(which)
        }

        // search tags (top three)
        var tags = p.emojis
        var set = false

        //console.log("Get backpropagate emojis: " + tags)
        var search = ""

        // pick a random tag
        var rnd = Math.floor(Math.random() * tags.length)
        for (var i = 1; i < tags.length; i++) {
            var t = tags[i]

            if ((!(set)) && (i == rnd)) {
                search = tags[i]
                set = true
            }
        }

        if (search) {
            var s = search.codePointAt(0).toString(16)
            console.log("Backpropagate from emoji: " + search)
            //console.log(preds)
            ret = s
        }

    }
    lastPD = which

    return ret
}
