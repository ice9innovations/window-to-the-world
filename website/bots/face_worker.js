onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Face Worker message received: " + event.data)
    faces(event.data)
}

function faces(which) {
    //console.log("objectBot: " + which)
    var tagStr = ""

    var url = "/face/?img=" + which //.replace("b.jpg",".jpg")
    //console.log("Face Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("Face Worker received data")
        processResponse(response)

    }).catch(error => {
      // Handle error
    })

}

async function processResponse(response) {
    var output_tags = []

    let data = await response.text()

    var jsonData                    
    if (response.body) {
        jsonData = JSON.parse(data)
    }

    var output_tags = []
    if (jsonData) {
        if (jsonData) {
            //console.log(jsonData)
            var faces = jsonData.faces
            if (faces == "undefined") {
                faces = null
            }

            var tagStr = "faces_" + faces

            console.log("Face Worker Adding tag: " + tagStr)
            output_tags.push(tagStr)

            postMessage(output_tags)

        }   
    }
}
