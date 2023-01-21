onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Inception_v3 worker message received: " + event.data)
    caption(event.data)
}

function caption(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "http://192.168.0.32/BLIP/?img=" + which.replace("b.jpg","l.jpg")
    var url = "http://192.168.0.32/inception/?img=" + which

    console.log("Inception_v3 Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("Inception_v3 worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var caption = ""

    let data = await response.text()

    var jsonData
    if (response.body) {
        console.log(data)
        //jsonData = JSON.parse(data)
        jsonData = data
    }

    var output_tags = []
    if (jsonData) {
        var tags = jsonData.toString()
        //caption = caption.replaceAll(".","").replaceAll("<unk>","").replaceAll(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll("  ", " ").toLowerCase()
        
        //console.log("Inception_v3 Tags: " + tags)

        if (tags) {
            //var capt = jsonData.caption.replace(".","").replaceAll("<unk>","").toLowerCase()
            //console.log("Adding caption: " + caption)
        }

        postMessage(tags)

    }


}

