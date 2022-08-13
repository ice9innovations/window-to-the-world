
// Web worker, multi-threaded
function METADATAworker(which, username) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting metadata worker for: ' + which)
            w = new Worker("/bots/meta_worker.js")

            if (which) {
                var el = buildImageHTML(which.replace("img-",""))
                var el = document.getElementById(which) 
                if (el) {
    
                    var tmp = {}
                    tmp.which = el.src
    
                    if (tmp.which) {
                        w.postMessage(tmp)
                    } else {
                        console.log("Stopping metadata worker: missing data")
                        stopWorker(w)
                    }
                } else {
                    // close the worker
                    console.log("Stopping metadata worker: missing HTML element")
                    stopWorker(w)
                }
            } else {
                // close the worker
                console.log("Stopping metadata worker: missing image element")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log(event.data)
            var tags = event.data
            var tagStr = tags.join(" ")
            if (tagStr) { 
                if (tags != " ") {
                    console.log("Metadata Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)

                    var aTag = tagStr.split(" ")
                    for (var i = 0; i < aTag.length; i++) {
                        var tag = aTag[i]
                        if (tag) {
                            tag = tag.replace("meta_","")
                            var ts = tag.split("-")

                            var key = ts[0]
                            var val = ts[1]

                            if (key == "filesize") {
                                var fs = parseInt(val)
                                //var mp = parseInt(val)
                                //mp = Math.floor(Math.round(mp / 100))

                                if (fs > 4) {
                                    console.log("Metadata Worker starting object workers for: " + which)
                                    // only run if greater than 0mp
                                    OBJECTworker(which, username)
                                    COCOworker(which, username)
                                } 
                            }
                        }
                    }
                }
            } else {
                stopWorker(w)
            }
        }
    } else {
        console.log("No web worker support, using slower function")
        metaLegacy(which)
    }
}


function metaLegacy(which) {
    //console.log("MetaBot: " + which)

    var tagStr = ""
    var el = buildImageHTML(which.replace("img-",""))

    var url = "/metadata/metadata.php?img=" + el.url     
        
    $.get(url, function(data, status){
        var jsonData
        if (data) {
            jsonData = JSON.parse(data);
            //console.log("Data: " + JSON.stringify(jsonData.meta));
        }

        if (jsonData) {

            var tags = jsonData.meta;

            //console.log(tags)

            var tagStr = "";
            if (tags) {
                for (var key in tags) {
                    var val = tags[key];

                    if (key == "megapixels") {
                        val = (Math.round(val))
                    }

                    tagStr += "meta_";
                    tagStr += key; // key
                    tagStr += "-"; // separator
                    tagStr += val; // value
                    tagStr += " ";

                    if ((val == "92df15607a4b9cc0891e24e38e99df857043015c")) {
                        // for sure it's the loading image
                        var tmp = which.replace("img-","")
                        var dad = document.getElementById(tmp)
                        if (dad) {
                            $(dad).addClass("confirm_404")
                            $(dad).addClass("auto_delete")

                        }
                        tagImage(which, "confim_404")
                    }

                }


                // add tags                           
                console.log("Adding tag: " + tagStr)
                tagImage(which, tagStr)

                tagStr = "";
            }
            
        }
    });   

}
