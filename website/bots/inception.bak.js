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
                  console.log("Inception_v3 results: " + results)
                        //tagImage(which, capt2)
                  var r = results.split(',')
                  //var r = JSON.parse(results)
		  for (var i = 0; i < r.length; i++) {
                    var tmp = r[i]
                    tmp = tmp.replace(/'/g,"").replace(/[/g,"").replace(/]/g,"") //.trim()

                    var aTmp = tmp.split(": ")
                    var key = aTmp[0]
console.log(key)

                    if (key) {
                      //key = key.replace(/'/g,"").replace(/[/g,"").replace(/]/g,"").trim()
                    }

                    var val = aTmp[1]
console.log(val)

                    if (val) {
                      //val = val.replace(/'/g,"").replace(/[/g,"").replace(/]/g,"").trim()
                      val = Math.round(parseFloat(val) * 100) / 100
                    }

            //#print("{0:>6.2%} : {1}".format(score, name))
                    if (val >= .625) {
                      console.log("Inception key: " + key)
                      console.log("Inception val: " + val)
                      var tag = "inception_" + key + "-" + (val * 100)

                      console.log("Inception_v3 tagging image with " + tag)
                      tagImage(which,tag)
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
