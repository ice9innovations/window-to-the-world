// Web worker, multi-threaded
function PREFworker(which, username) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting preference worker for: ' + which)
            w = new Worker("/bots/prefs_worker.js")

            console.log("Preference for: " + which)
            //var emoTags = []
            var msg = {}
            if (which) {
                //console.log(tagStr)
                var model = buildDataModel(which)

                //console.log(model)
                var msg = {}
                msg.user = username
                
                votes = model.votes
                msg.tags = votes.first
                console.log(model)
                msg.id = which
                console.log(msg)
                
            }


            if (msg.user && msg.tags) {
                w.postMessage(msg)
            } else {
                console.log("Stopping preference worker worker: missing data")
                stopWorker(w)
            }

        }
        w.onmessage = function(event) {   
            
            var tags = event.data[0]
            var which = event.data[1]

            //console.log("Preferences for " + which)
            //console.log(tags)

            category = tags.category
            timesMoreLikely = tags.timesMoreLikely
            probability = tags.probability
            if (probability >= .5) {

                if (category == "good") {
                    console.log("Preference Worker tagging image with: predict_like")
                    tagImage(which, "prefs_predict_like")
                }
    
                if (category == "bad") {
                    console.log("Preference Worker tagging image with: predict_dislike")
                    tagImage(which, "prefs_predict_dislike")
                }
            } else {
                console.log("Preference Worker tagging image with: predict_neutral")
                tagImage(which, "prefs_predict_neutral")
            }
            
            //console.log("Stopping preference worker: complete")
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, cannot continue.")
    }
}