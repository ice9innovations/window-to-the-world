onmessage = function(event) {
    // the passed-in data is available via e.data
    //console.log("Classify Worker message received: " + event.data)
    //classifyBot(event.data)
}

function classifyBot(tagStr) {
    //console.log("objectBot: " + which)

    var url = "/avm/avm.php?q=" + tagStr //.replace("b.jpg",".jpg")
    //console.log("Classify Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("Classify Worker received data")
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

    if (jsonData) {
        tmp = jsonData[0]

        //console.log("AVM Data received")
        //console.log(tmp)
        //console.log(tmp.total)

        var val = tmp.total
          if (!val) { val = 0 }

          var cat = "avm_" + tmp.category + "-" + Math.ceil(val * 100)
  
          output_tags.push(cat)
          output_tags.push("avm_" + tmp.category)

          if (tmp.category == "animals") {
            // get the image tags
            //var str = getObjectDetectorTags(which)
            //console.log(str)

            // detect what might be in it
            //animal(which, str.toString())
          }

          if (tmp.category == "vegtables") {
            // get the image tags
            //var str = getObjectDetectorTags(which)
            //console.log(str)

            // detect what might be in it
            //vegetable(which, str.toString())
          }

          if (tmp.category == "minerals") {
            // get the image tags
            //var str = getObjectDetectorTags(which)
            //console.log(str)

            // detect what might be in it
            //mineral(which, str.toString())
              
          }
    }
    
    aImages = ""
    postMessage(output_tags)

}