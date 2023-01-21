onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("CaptionNN Worker message received: " + event.data)
    caption(event.data)
}

function caption(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/caption/caption.php?img=" + which //.replace("b.jpg",".jpg")
    //console.log("Caption Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("CaptionNN Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var caption = ""

    let data = await response.text()
    // console.log(data)

    var jsonData                    
    if (response.body) {
        jsonData = JSON.parse(data)
    }

    var output_tags = []
    if (jsonData) {
        var caption = jsonData.caption.toString()
        caption = caption.replaceAll(".","").replaceAll("<unk>","").replaceAll(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll("  ", " ").toLowerCase()
        
        if (caption) {
                         
            //var capt = jsonData.caption.replace(".","").replaceAll("<unk>","").toLowerCase()
            //console.log("Adding caption: " + caption)

            
        }
         
    }

    postMessage(caption)

}

