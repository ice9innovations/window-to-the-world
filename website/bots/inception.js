// Web worker, multi-threaded
function INCEPTIONworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting inception_v3 worker for: ' + which)
            w = new Worker("/bots/inception_worker.js")

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
                console.log("Stopping inception_v3 worker: missing HTML element")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var results = event.data
            //var tagStr = tags.join(" ")
            if (results) { 
                if (results != " ") {
                  //console.log("Inception_v3 results: " + results)
                        //tagImage(which, capt2)
                  var r = results.split(',')
		          for (var i = 0; i < r.length; i++) {
                    var tmp = r[i]
                    var aTmp = tmp.split(":")

                    var key = aTmp[0]

                    if (key) {
                      key = key.replace(/"/g,"").replace(/'/g,"").replace("[","").replace("]","").trim()
                    }

                    var val = aTmp[1]

                    if (val) {
                      val = val.replace(/"/g,"").replace(/'/g,"").replace("[","").replace("]","").trim()
                      val = Math.round(parseFloat(val).toFixed(3) * 1000) / 1000
                    }

            //#print("{0:>6.2%} : {1}".format(score, name))
                    if (val >= .5) {
                      var tag = "inception_" + key + "-" + Math.floor(val * 1000)
                      var emoji = "emoji_" + aTmp[2]

                      tagImage(which,tag)
                      console.log("Inception_v3 Worker tagging image with " + tag)
                    }

                    // emoji
                    if (val >= .5) {
                      var emoji = "InceptionEmoji_" + aTmp[2]
  
                      tagImage(which,emoji)
                      console.log("Inception_v3 Worker tagging image with " + emoji)
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
