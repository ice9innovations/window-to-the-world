function COCOworker(which, username) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting COCO worker for: ' + which)
            w = new Worker("/bots/coco_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src
                w.postMessage(url)
            } else {
                console.log("Stopping COCO worker: missing tags")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var tags = event.data
            var tagStr = tags.join(" ")
            if (tagStr) { 
                if (tags != " ") {
                    console.log("COCO Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)
                    
                    // get predictions
                    var preds = updatePrediction(which)
                    //console.log("COCO Predictions: ")
                    //console.log(preds)
                    
                    if (preds) {
                        var emo_list = preds.emojis
                        var emo_tags = []
                        // tag with emojis
                        for (var i = 0; i < emo_list.length; i++) {
                            var emo = emo_list[i]
                            if (emo) {
                                emo_tags.push(emo)                
                            }    
                        }

                        console.log("COCO Adding tag: " + emo_tags.join(" "))
                        tagImage(which, "emoji_" + emo_tags.join(" "))

                        // check preferences
                        //PREFworker(which, username)
                    }
                    
                    // Animal, Vegetable, Mineral
                    tagStr = tagStr.replaceAll(" ",",").replaceAll("multi_","").replace("predict_","")
                    //CLASSIFYworker(which, tagStr)
                    
                }
            }
    
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        cocoBot(which)
    }
}





var lastCocoImage
function cocoBot(which) {
    //console.log("CocoBot: " + which)

    var tagStr = ""
    var el = buildImageHTML(which.replace("img-",""))

    var elURL = el.url
    var url = "/multi/multi.php?img=" + elURL //.replace("b.jpg",".jpg")
    $.get(url, function(data, status){

        if (data) {
            var jsonData = JSON.parse(data);
            //console.log("Data: " + JSON.stringify(jsonData.tags));
        }

        if (jsonData) {
            var tags = jsonData.tags;

            var tagStr = ""
            if (tags) {
                
                // now run predictions
                var firstObject = tags[0]
                var lastObj = ""
                if (firstObject) {
                    lastObj = firstObject.object
                }
                var lastConf = 0
                for (var i = 0; i < tags.length + 1; i++) {
                    var t = {}

                    if (!(tags[i])) {
                        // blank object
                        t.object = ""
                        t.confidence = 0
                    } else {
                        t = tags[i]
                    }

                    if (t.object && t.confidence) {
                        
                        var obj = t.object
                        var confidence = t.confidence

                        // add the confidence

                        if (obj == lastObj) {
                            // it's the same so add it together
                        } else {
                            var lt = {}
                            if (i > 0) {
                                lt = tags[i - 1]
                            }
                            
                            // calculate confidence
                            //lastConf += confidence

                            var confNum = Math.round(lastConf)
                            var confStr = confNum.toString()
                            if (confNum < 10) { confStr = "0" + confStr }

                            // tag it
                            var key = lastObj.replace(" ","_").toLowerCase()

                            tagStr += "multi_"
                            tagStr += key // key
                            tagStr += "-"; // separator
                            tagStr += confNum // value
                            tagStr += " "
                            
                            lastConf = 0
                        }

                        // better than chance...
                        if ((key == "person") || (key == "people")) {
                            // go ahead and tag it as a person
                            if (confNum >= 90) {
                                tagImage(which, "predict_animals")
                                tagImage(which, "predict_person")
                            }
                        }

                        lastConf += t.confidence
                        lastObj = t.object
                    }
                    
                    if (i >= tags.length) {
                        // calculate confidence
                        //lastConf += confidence

                        var confNum = Math.round(lastConf)
                        var confStr = confNum.toString()
                        if (confNum < 10) { confStr = "0" + confStr }

                        // tag it
                        var key = lastObj.replace(" ","_").toLowerCase()

                        tagStr += "multi_"
                        tagStr += key // key
                        tagStr += "-"; // separator
                        tagStr += confNum // value
                        tagStr += " "
                        
                        lastConf = 0

                    }
                           
                }
                
                // add tags              
                if (!(tagStr.includes("multi_-0"))) { //blank
                    
                    console.log("COCO Adding tag: " + tagStr)

                    tagImage(which, tagStr)
                    classify(which, tagStr.replaceAll(" ",",").replaceAll("multi_",""))

                    // get preferences
                    var preds = updatePrediction($(which))
                    if (preds) {
                        var emo_list = preds.emojis

                        // tag with emojis
                        for (var i = 0; i < emo_list.length; i++) {
                            var emo = emo_list[i]
                            
                            console.log("Adding tag: " + emo)
                            tagImage(which, "emoji_" + emo)
                        }
                    }

                    //prefs(which)
                    //prefs_color(pos3)
                    //prefs_meta(which)

                }             
                tagStr = ""

            }
        }
        
        lastCocoImage = url
        aImages = ""
    })
}
