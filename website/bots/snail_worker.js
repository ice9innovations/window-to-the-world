onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Snail Worker message received: " + event.data)
    snail(event.data)
}

function snail(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/colors/?img=" + which //.replace("b.jpg",".jpg")
    console.log("Snail Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("Snail Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var output_tags = []

    let data = await response.text()
    //console.log(data)

    var jsonData                    
    if (response.body) {
        jsonData = JSON.parse(data)
    }

    var output_tags = []
    if (jsonData) {
        if (jsonData) {
            var colors = jsonData.colors
            dominant = colors[1]
            colors = colors[2] // copic

            var palette = colors.palette[0]["copic"]

            //console.log(palette)
            //var grayscale = jsonData.grayscale

            var tagStr = ""
            if (dominant) {
                for (var key in dominant) {
                    var val = dominant[key]
                    val = val.hex

                    tagStr += "color_primary"
                    //tagStr += key // key
                    tagStr += "-" // separator
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            }    

            if (palette) {
                for (var key in palette) {
                    var val = palette[key]
                    val = val.hex

                    tagStr += "color_palette-"
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            } 
            

            // apply tags to image
            //console.log("Snail Worker Adding tags: " + tagStr)
            output_tags.push(tagStr)
            postMessage(output_tags)
        }   
    }
}