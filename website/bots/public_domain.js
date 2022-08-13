// Web worker, multi-threaded
function PDworker(q) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting public domain worker')
            w = new Worker("/bots/pd_worker.js")
            w.postMessage(q)

        }
        w.onmessage = function(event) {
            console.log("Public domain worker message received")
            var jsonData = event.data

            if (jsonData) {
                data = JSON.parse(event.data)
                
                // console.log("Data: " + data.ad)
                // console.log(data.ad)

                var img = new Image()
                var img_id = "img-" + data.image

                img.onload = function() {
                    console.log("Testing public domain image: " + img_id)
                    testImage(img_id)
                }
                img.id = img_id
                img.src = "https://img.window-to-the-world.org/public_domain/tn/" + data.image
                img.className = "pd"
            
                // build link
                var a = document.createElement('a')
                a.href = "javascript: clickImage('" + img_id.replace("img-","pd-") + "')"
                a.id = "pd-" + data.image
                a.className = "public_domain"

                // add image to link
                a.appendChild(img)

                // add to test buffer
                console.log(a)
                windowBuffer.appendChild(a)

            }

            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        getPublicDomainImage(q)
    }
}

var lastPD = ""
function getPublicDomainSearchTerm(preds, which) {
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
        var tags = p.search 
        var set = false

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
            var s = search
            //console.log("Get public domain image: " + s)
            //console.log(preds)
            ret = s
        }

    }
    lastPD = which

    return ret
}


function getPublicDomainImage(search_term) {
    // get the current user?
    var img = {}
    var url = "/public_domain/?q=" + search_term
    
    // cloudy with a chance of ads

    console.log("Get public domain image: " + url)

    // serve an advertisement
    $.ajax({
        url: url,
        type: "GET",
        dataType:'json',
        catch: function(error) {
            console.log(error)
        },
        success: function(data) {
            console.log("Received public domain image!")
    
            var jsonData = data
            console.log(jsonData)

            if (jsonData) {

                console.log("Data: " + jsonData)
                var img = new Image()
                var img_id = "img-" + jsonData.image

                img.onload = function() {
                    console.log("Testing new public domain image: " + img_id)
                    testImage(img_id)
                }
                img.id = img_id
                img.src = "https://img.window-to-the-world.org/public_domain/tn/" + jsonData.image
                img.className = "pd"
            
                // build link
                var a = document.createElement('a')
                a.href = "javascript: clickImage('" + img_id.replace("img-","pd-") + "')"
                a.id = "pd-" + jsonData.image
                a.className = "public_domain"

                // add image to link
                a.appendChild(img)

                // add to test buffer
                console.log(a)
                windowScreen.appendChild(a)
            }
        }
    })
    
}
