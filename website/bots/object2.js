
var lastObjectImage
function objectBot2(which) {
    console.log("ObjectBot2: " + which)

    var tagStr = ""
    var el = buildImageHTML(which.replace("img-",""))

    var elURL = el.url

    var url = "/object2/object2.php?img=" + elURL.replace(".jpg","b.jpg")
    console.log(url)

    $.get(url, function(data, status){

        if (data) {
            var jsonData = JSON.parse(data)
            console.log("Data: " + JSON.stringify(jsonData.tags))
        }

        if (jsonData) {

            var tags = jsonData.tags

            var tagStr = ""
            if (tags) {
                for (var key in tags) {
                    var val = tags[key]
                    var tmpVal = val

                    if (val) { val = val.toString().toLowerCase() }
                    if (tmpVal < 10) { val = "0" + val }

                    tagStr += "object_"
                    tagStr += key.toLowerCase() // key
                    tagStr += "-" // separator
                    tagStr += val.replace("/ /g","_").replace("[","-").replace("]","").replace("'","") // value
                    tagStr += " "
                }

                
                // add tags         
                if (tagStr != "")  {
                    console.log("Object2 adding tag: " + tagStr)
                    tagImage(which, tagStr)
                    //nsfw(which, tagStr.replace("/ /g",",").replaceAll("object_",""))
                    //classify(which, tagStr.replace("/ /g",",").replaceAll("object_",""))
                }                 

                tagStr = ""
            }
        }
        
        lastObjectImage = url
        aImages = ""
    })

}