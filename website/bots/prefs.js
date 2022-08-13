// Web worker, multi-threaded
function PREFworker(which, username) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting preference worker for: ' + which)
            w = new Worker("/bots/prefs_worker.js")

            var emoTags = []
            if (which) {
                //console.log(tagStr)
                var im = which.replace("img-","").replace("ad-","")
                var elim = document.getElementById(im)

                if (elim) {
                    var els = elim.getElementsByTagName('img')
                    var el = els[0]
                    var cls 

                    if (el) {
                    cls = el.className 
                    } else {
                        cls = ""
                    }
                    
                    var aCls = cls.split(" ")
            
                    // get current emoji tags
                    console.log("Preference worker getting current tags")
                    for (var i = 0; i < aCls.length; i++) {
                        var tag = aCls[i]
                    
                        if (tag.includes("emoji_")) {
                            var tmp = tag.replace("emoji_","")
                            if (tmp) {
                                tmp = tmp.codePointAt(0).toString(16) // eng to unicode
                                emoTags.push(tmp)
                            }
                        }
                    }
                }
            }

            var msg = {}
            msg.user = username
            msg.tags = emoTags

            if (msg.user && msg.tags) {
                w.postMessage(msg)
            } else {
                console.log("Stopping preference worker worker: missing data")
                stopWorker(w)
            }

        }
        w.onmessage = function(event) {            
            var tags = event.data
            var tagStr = tags.join(" ")
            if (tagStr) { 
                if (tags != " ") {
                    // clear tags

                    untagPreferences(which)

                    console.log("Preference Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)
                }
            }
            //console.log("Stopping preference worker: complete")
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        prefs(which)
    }
}

function untagPreferences(which) {
    if (which) {
        //console.log(tagStr)
        var im = which.replace("img-","").replace("ad-","")
        var elim = document.getElementById(im)
        
        // also need to remove valence/strength tags
        if (elim) {
            
            elim.classList.remove("prefs_like")
            elim.classList.remove("prefs_dislike")
            elim.classList.remove("prefs_neutral")
    
            elim.classList.remove("predict_like")
            elim.classList.remove("predict_dislike")
            elim.classList.remove("predict_neutral")
    
            elim.classList.remove("sentiment_like")
            elim.classList.remove("sentiment_dislike")
            elim.classList.remove("sentiment_neutral")

            // clear image predictions
            var els = elim.getElementsByTagName('img')
            var el = els[0]
    
            if (el) {
                var cls = el.className

                // clear prediction strength
                if (cls.includes("sentiment_strength")) {
                    //console.log("sentiment_strength: " + which)
                    var aCls = cls.split(" ")
                    for (var i = 0; i < aCls.length; i++) {
                        var tmp = aCls[i]
                        if (tmp.includes("sentiment_strength")) {
                            //console.log("Removing sentiment_strength from: " + which)
                            el.classList.remove(tmp)
                        }
                    }
                }
        
                // clear prediction valence
                if (cls.includes("sentiment_valence")) {
                    //console.log("sentiment_valence: " + which)
                    var aCls = cls.split(" ")
                    for (var i = 0; i < aCls.length; i++) {
                        var tmp = aCls[i]
                        if (tmp.includes("sentiment_valence")) {
                            //console.log("Removing sentiment_valence from: " + which)
                            el.classList.remove(tmp)
                        }
                    }
                }
            }
        }
    }
}

function prefs(which) {
    var emoTags = []
    if (which) {
        //console.log(tagStr)
        var im = which.replace("img-","").replace("ad-","")
        console.log(im)

        var elim = document.getElementById(im)

        if (elim) {

            var els = elim.getElementsByTagName('img')
            var el = els[0]
    
            var cls = el.className
            var aCls = cls.split(" ")
    
            // get current emoji tags
            for (var i = 0; i < aCls.length; i++) {
                var tag = aCls[i]
    
                if (tag.includes("emoji_")) {
                    var tmp = tag.replace("emoji_","")
                    tmp = tmp.codePointAt(0).toString(16) // eng to unicode
                    emoTags.push(tmp)
                }
            }
      
            var jn = emoTags.join(",")
            var url = "/retrieve_emojis/index.php?user=demo&emoji=" + emoTags
    
    
            console.log("Predict preference: ")
            console.log(url)

            $.get(url, function(data, status){
                if (data) {
        
                // tag image
        
                var jsonData = JSON.parse(data)
                console.log(jsonData)

                var tmp = jsonData.preference

                // calculate group of icons separately
                if (tmp) {

                    var sentiment, valence
                    var individual = tmp.individual
                    var exact = tmp.exact
                    var totals = tmp.totals
                    var strength = 0

                    untagPreferences(which)
                    
                    // get exact match
                    if (exact) {
                        console.log(exact)

                        sentiment = exact.sentiment
                        valence = exact.valence
                        strength = exact.strength

                        console.log("Exact sentiment: " + sentiment)
                        console.log("Exact valence: " + valence)
                        console.log("Exact strength: " + strength)

                    }       
                    
                    if (valence == 1) { valence = 100 }
                    if (valence < 1) { valence *= 100 }
                    if (valence < 0) { valence = 0 }

                    valence = Math.round(valence)

                    //if (valence > 100) { valence = 100 }

                    // no exact match
                    if (sentiment == "neutral" && valence == 0) {
                        // match on each individual emoji
                        console.log(individual)

                        sentiment = individual.sentiment
                        valence = individual.valence
                        strength = individual.strength

                        console.log("Overall sentiment: " + sentiment)
                        console.log("Overall valence: " + valence)
                        console.log("Overall strength: " + strength)
                    }
                    
                    // still nothing
                    if (sentiment == "neutral" && valence == 0) {
                        // use the broadest method
                        console.log(totals)

                        sentiment = totals.sentiment
                        valence = totals.valence
                        strength = totals.strength

                        console.log("Total sentiment: " + sentiment)
                        console.log("Total valence: " + valence)
                        console.log("Total strength: " + strength)
                    }

                    // take action
                    if (sentiment) {
                        console.log("Tagging image with: predict_" + sentiment)
                        tagImage(which, "predict_" + sentiment)
                    }

                    if ((valence > 33) && (strength > 10)) {
                        console.log("Tagging image with: sentiment_" + sentiment)
                        tagImage(which, "sentiment_" + sentiment)
                    }

                    if ((valence > 66) && (strength > 10)) {
                        console.log("PREDICTION STRENGTH: " + strength)
                
                        // tag it for automatic deletion
                        if (sentiment == "dislike") {
                            console.log("Automatically delete: " + im)
                            tagImage(im, "prefs_dislike")
                        } else {
                            console.log("Automatially superlike: " + im)
                            tagImage(im, "prefs_like")
                        }
                    } 
        
                    if (valence) {
                        console.log("Tagging image with: sentiment_valence_" + valence)
                        tagImage(which, "sentiment_valence_" + valence)
                    }

                    if (strength) {
                        console.log("Tagging image with: sentiment_strength_" + strength)
                        tagImage(which, "sentiment_strength_" + strength)
                    }
                }
                }
            })
        }
    }
}