onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Backpropagate Worker message received.")
    backpropagateBot(event.data)
}


function backpropagateBot(data) {
    var tagStr = ""
    var q, usr = ""

    if (data) {
        if (data.q) { q = data.q }
        if (data.usr) { usr = data.usr }
    }

    //if (q != "") { // do it anyway

        var url = "/backpropagate/?user=" + usr + "&emoji=" + q //.replace("b.jpg",".jpg")
        // console.log("Backpropagate Worker fetching url: " + url)
        fetch(url, {
            mode: 'no-cors',
            method: 'GET',
            headers: {
              Accept: 'application/json',
            }
        })
        .then(response => {
            // Handle data
    
            console.log("Backpropagate worker received data")
            processResponse(response)
    
        }).catch(error => {
          // Handle error
          postMessage("error")
        })

    //}

}

async function processResponse(response) {
    let data = await response.text()

    var jsonData                    
    if (data) {
        if (data != " ") {
            //console.log(data)
            jsonData = (data)
        }
    }

    postMessage(jsonData)
}