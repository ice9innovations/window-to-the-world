onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Snail Worker message received: " + event.data)
    snail(event.data)
}

function snail(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/snail/snail.php?img=" + which //.replace("b.jpg",".jpg")
    //console.log("Snail Worker fetching url: " + url)
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
            var palette = jsonData.palette
            var grayscale = jsonData.grayscale

            var tagStr = ""
            if (colors) {
                for (var key in colors) {
                    var val = colors[key]

                    tagStr += "color_"
                    tagStr += key // key
                    tagStr += "-" // separator
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            }      

            if (palette) {
                for (var key in palette) {
                    var val = palette[key]

                    tagStr += "color_palette-"
                    tagStr += val.replace("#","") // value
                    tagStr += " "
                }

            }   
            
            if (grayscale) {
                for (var key in grayscale) {
                    var val = grayscale[key]

                    tagStr += "color_grayscale-"
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