onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Ad worker message received: " + event.data)
    adBot(event.data)
}


function adBot(tag) {

    if (tag != "") {

        var url = "/ads/" //.replace("b.jpg",".jpg")
        console.log("Ad Worker fetching url: " + url)
        fetch(url, {
            mode: 'no-cors',
            method: 'GET',
            headers: {
              Accept: 'application/json',
            }
        })
        .then(response => {
            // Handle data
    
            console.log("Ad Worker received data")
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