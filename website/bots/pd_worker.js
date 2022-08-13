onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Public domain Worker message received: " + event.data)
    pdBot(event.data)
}

function pdBot(q) {
    //console.log("OCRBot: " + which)
    var tagStr = ""

    if (q != "") {
        var url = "/public_domain/?q=" + q //.replace("b.jpg",".jpg")
        console.log("Public domain Worker fetching url: " + url)
        fetch(url, {
            mode: 'no-cors',
            method: 'GET',
            headers: {
              Accept: 'application/json',
            }
        })
        .then(response => {
            // Handle data
    
            console.log("Public domain worker received data")
            processResponse(response)
    
        }).catch(error => {
          // Handle error
          postMessage("error")
        })

    }

}

async function processResponse(response) {
    let data = await response.text()

    var jsonData                    
    if (data) {
        if (data != " ") {
            console.log(data)
            jsonData = (data)
        }
    }

    postMessage(jsonData)
}