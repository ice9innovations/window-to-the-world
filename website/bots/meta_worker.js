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

    //var url = "/metadata/?img=" + which.replace("b.jpg",".jpg")
    var url = "/metadata/?img=" + which.replace("tn/thumb.","")
    console.log("Metadata Worker fetching url: " + url)
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

function buildTagString(key, val) {
    tagStr = ""
    tagStr += "meta_";
    tagStr += key; // key
    tagStr += "-"; // separator
    tagStr += val; // value
    tagStr += " ";

    return tagStr
}

function countDecimals(value) {
    if (Math.floor(value) !== value)
        return value.toString().split(".")[1].length || 0;
    return 0;
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
        var tags = jsonData;
        for (var tag in tags) {
            key = tag
            val = tags[tag]

            key = key.toLowerCase()
            aKey = key.split(":")
            if (aKey[1]) {
                key = aKey[1]
            } else {
                key = aKey[0]
            }

            //console.log(key + ": " + val)
            height = 0
            width = 0
            switch (key) {
                case "sha1":
                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "md5":
                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "filetype":
                    val = val.toLowerCase()
                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "aspect":
                    val = val % 1
                    dec = countDecimals(val)

                    // convert to string
                    str_dec = "1"
                    for (var i = 0; i < dec; i++) {
                        str_dec = str_dec + "0"
                    }
                    int_dec = parseInt(str_dec)
                    val = val * int_dec

                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "megapixels":
                    val = Math.round(val)
                
                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "filesize":
                    val = Math.round(val / 1000)
                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "model":
                    tmp_val = val.replace(/ /g,"_").toLowerCase()
                    tmp_tag = buildTagString(key, tmp_val)
                    output_tags.push(tmp_tag)
                    break
                case "xresolution":
                    tmp_key = "resolution"
                    tmp_tag = buildTagString(tmp_key, val)
                    output_tags.push(tmp_tag)
                    break
                case "entropy":
                    tmp_val = val.toString()
                    tmp_val = tmp_val.replace(".","")
                    tmp_tag = buildTagString(key, tmp_val)
                    output_tags.push(tmp_tag)
                    break
                case "square":
                    tmp_tag = buildTagString(key, val)
                    output_tags.push(tmp_tag)
                    break
                case "imageheight":
                    height = val
                    tmp_key = "height"
                    tmp_tag = buildTagString(tmp_key, val)
                    output_tags.push(tmp_tag)
                    break
                case "imagewidth":
                    width = val
                    tmp_key = "width"
                    tmp_tag = buildTagString(tmp_key, val)
                    output_tags.push(tmp_tag)
                    break
            }

        }
        //console.log(output_tags)

        var tagStr = "";
        /*if (tags) {
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
        */
        
        postMessage(output_tags)
    
    }  
}