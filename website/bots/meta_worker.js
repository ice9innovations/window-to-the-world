onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Metadata Worker message received: " + event.data)
    metaBot(event.data)
}

function metaBot(data) {
    console.log("Metadata Worker: " + data)

    var which = ""
    var usr = ""
    if (data) {
        if (data.which) { which = data.which }
        if (data.usr) { usr = data.usr }
    }

    var url = "/metadata/metadata.php?img=" + which.replace("b.jpg",".jpg")
    //console.log("Metadata Worker fetching url: " + url)
    fetch(url, {
        mode: 'no-cors',
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
    })
    .then(response => {
        // Handle data

        console.log("Metadata Worker received data")
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

    if (jsonData) {
        var tags = jsonData.meta;

        //console.log(tags)

        var tagStr = "";
        if (tags) {
            for (var key in tags) {
                var val = tags[key];

                if (key == "megapixels") {
                    val = val * 100
                }

                if ((key == "animated") && (val == true)) {
                    tagStr += "predict_animated "
                }

                tagStr += "meta_";
                tagStr += key; // key
                tagStr += "-"; // separator
                tagStr += val; // value
                tagStr += " ";

                if ((val == "92df15607a4b9cc0891e24e38e99df857043015c")) {
                    output_tags.push("confim_404")
                }

            }


            // add tags                           
            //console.log("Metadata Worker Adding tag: " + tagStr)
            output_tags.push(tagStr)

            tagStr = "";
        }
        
        postMessage(output_tags)
    
    }  
}