// Web worker, multi-threaded
function ADworker() {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting advertisement worker')
            w = new Worker("/bots/ads_worker.js")

            var tags = "go"
            w.postMessage(tags)

        }
        w.onmessage = function(event) {
            console.log("Advertisement worker message received")
            var jsonData = event.data

            if (jsonData) {
                data = JSON.parse(event.data)
                
                // console.log("Data: " + data.ad)
                // console.log(data.ad)

                var img = new Image()
                var img_id = "img-" + data.ad

                img.onload = function() {
                    console.log("Testing advertisement: " + img_id)
                    testImage(img_id)
                }
                img.id = img_id
                img.src = "https://img.window-to-the-world.org/tn/" + data.ad
                img.className = "ad"
            
                // build link
                var a = document.createElement('a')
                a.href = "javascript: clickImage('" + img_id.replace("img-","ad-") + "')"
                a.id = "ad-" + data.ad
                a.className = "advertisement"

                // add image to link
                a.appendChild(img)

                // add to test buffer
                //console.log(a)
                windowBuffer.appendChild(a)

            }

            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        getAdvertisement()
    }
}


function getAdvertisement() {
    // get the current user?
    var img = {}
    var url = "/ads/"
    
    // cloudy with a chance of ads

    console.log("Get Advertisement!")

    // serve an advertisement
    $.ajax({
        url: url,
        type: "GET",
        dataType:'json',
        catch: function(error) {
            console.log(error)
        },
        success: function(data) {
            console.log("Received Advertisement!")
    
            var jsonData = data
            console.log(jsonData)

            if (jsonData) {

                console.log("Data: " + jsonData)
                var img = new Image()
                var img_id = "img-" + jsonData.ad

                img.onload = function() {
                    console.log("Testing advertisement: " + img_id)
                    testImage(img_id)
                }
                img.id = img_id
                img.src = "https://img.window-to-the-world.org/tn/" + jsonData.ad
                img.className = "ad"
            
                // build link
                var a = document.createElement('a')
                a.href = "javascript: clickImage('" + img_id.replace("img-","ad-") + "')"
                a.id = "ad-" + jsonData.ad
                a.className = "advertisement"

                // add image to link
                a.appendChild(img)

                // add to test buffer
                console.log(a)
                windowScreen.appendChild(a)
            }
        }
    })
    
}
