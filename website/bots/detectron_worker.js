onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Detectron Worker message received: " + event.data)
    detectron(event.data)
}

function detectron(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    //var url = "http://192.168.0.32/BLIP/?img=" + which.replace("b.jpg","l.jpg")
    //var url = "http://192.168.0.32/BLIP/?img=" + which.replace("tn/thumb.","")
    var url = "/detectron/?img=" + which //.replace("tn/thumb.","") //.replace("https://window-to-the-world.org","http://178.62.236.25")

    console.log("Detectron Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET' /*,
        headers: {
          Accept: 'application/json',
        }*/
    })
    .then(response => {
        // Handle data

        console.log("Detectron worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var ret = ""

    let data = await response.text()

    var jsonData
    if (response.text) {
        //console.log(response.text)
        jsonData = JSON.parse(data)
        //jsonData = data
    }

    var output_tags = []
    if (jsonData) {
        caption = ""
        ret_tags = []
        for (var i in jsonData) {
            data = jsonData[i]
            for (j in data) {
                tmp = data[j]
                //console.log(tmp)
                for (var key in tmp) {
                    keyword = tmp.keyword
                    conf = tmp.confidence
                    emoji = tmp.emoji

                    //capt = capt.toString()
                    keyword = keyword.replaceAll(".","").replaceAll(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll(" ", "-").toLowerCase()
                    ret = keyword + "|" + conf + "|" + emoji
                    ret_tags.push(ret)
                    // console.log("Detectron: " + ret)
                }
                    
            }
        }
        //capt = tmp.caption
        //console.log(jsonData[i])
        

        if (caption) {
            //var capt = jsonData.caption.replace(".","").replaceAll("<unk>","").toLowerCase()
            //console.log("Adding caption: " + caption)
        }

        postMessage(ret_tags)

    }


}

