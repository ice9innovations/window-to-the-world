onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("LLaMa Worker message received: " + event.data)
    caption(event.data)
}

function caption(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    //var url = "http://192.168.0.32/BLIP/?img=" + which.replace("b.jpg","l.jpg")
    //var url = "http://192.168.0.32/BLIP/?img=" + which.replace("tn/thumb.","")
    var url = "/llama/?img=" + which //.replace("tn/thumb.","") //.replace("https://window-to-the-world.org","http://178.62.236.25")

    console.log("LLaMa Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET' /*,
        headers: {
          Accept: 'application/json',
        }*/
    })
    .then(response => {
        // Handle data

        console.log("LLaMa worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var caption = ""

    let data = await response.text()

    var jsonData
    if (response.text) {
        //console.log(response.text)
        jsonData = JSON.parse(data)
        //jsonData = data
    }

    var output_tags = []
    if (jsonData) {
        for (var i in jsonData) {
            data = jsonData[i]


            caption = data.trim()
            /*for (var key in data) {
                if (key == "caption") {
                    caption = data[key]
                }
            }*/

            //capt = tmp.caption
            console.log(jsonData[i])
        }
        //capt = capt.toString()
        caption = caption.replaceAll(".","").replaceAll("<unk>","").replaceAll(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll("  ", " ").toLowerCase()
        //caption = caption + "|" + emojis
        console.log("LLaMa Caption: " + caption)

        if (caption) {
            //var capt = jsonData.caption.replace(".","").replaceAll("<unk>","").toLowerCase()
            //console.log("Adding caption: " + caption)
        }

        postMessage(caption)

    }


}

