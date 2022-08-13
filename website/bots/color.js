function colorBot(which) {
    //console.log("ColorBot: " + which)

    var tagStr = ""

    var el = buildImageHTML(which.replace("img-",""))
    var url = "/colors/colors.php?img=" + el.url         
    
    $.get(url, function(data, status) {
        var jsonData

        if (data) {
            jsonData = JSON.parse(data);
        }

        if (jsonData) {
            var pal = jsonData.palette
            if (pal) {
                for (var i = 0; i < pal.length; i++) {
                    var val = pal[i]

                    if (val) {
                        tagStr += "palette_" + val + " "                                
                    }
                }

                console.log("Adding tags: " + tagStr)
                tagImage(which, tagStr)
            }
        }  
    })

    tagStr = ""
}
