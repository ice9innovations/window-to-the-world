function prefs_meta(which) {
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
            var metaTags = []
            for (var i = 0; i < aCls.length; i++) {
                var tag = aCls[i]
    
                if (tag.includes("emoji_")) {
                    var tmp = tag.replace("emoji_","")
                    tmp = tmp.codePointAt(0).toString(16) // eng to unicode
                    emoTags.push(tmp)
                }

                if (tag.includes("meta_")) {
                    var tmp = tag.replace("meta_","")
                    var aMetaTag = tmp.split("-")
                    console.log(tmp)

                    if ((!(tmp.includes("sha1"))) && (!(tmp.includes("md5")))) {
                        metaTags.push(tmp)
                    }
                }

            }
      
            // build url
            var urlAppend = ""
            if (metaTags) {
                for (var i = 0; i < metaTags.length; i++) {
                    var tag = metaTags[i]
                    var aTag = tag.split("-")
                    
                    var key = aTag[0]
                    var val = aTag[1]

                    if (key && val) {
                        urlAppend += "&" + key + "=" + val
                    }
                }    
            }

            var jn = emoTags.join(",")
            var url = "/retrieve_meta/index.php?user=demo&file=" + im + "&emoji=" + emoTags + urlAppend
    
            console.log(url)
    
            console.log("Predict Meta: ")
            //console.log(jn)
        
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

                    // get exact match
                    if (exact) {
                        console.log(exact)

                        sentiment = exact.sentiment
                        valence = exact.valence
                        strength = exact.strength

                        //console.log("Exact sentiment: " + sentiment)
                        //console.log("Exact valence: " + valence)
                        //console.log("Exact strength: " + strength)

                    }       
                    
                    if (valence == 1) { valence = 100 }
                    if (valence < 1) { valence *= 100 }
                    if (valence < 0) { valence = 0 }

                    valence = Math.round(valence)

                    //if (valence > 100) { valence = 100 }

                    // no exact match
                    if (sentiment == "neutral" && valence == 0) {
                        // match on each individual emoji
                        /*
                        console.log(individual)

                        sentiment = individual.sentiment
                        valence = individual.valence
                        strength = individual.strength

                        console.log("Overall sentiment: " + sentiment)
                        console.log("Overall valence: " + valence)
                        console.log("Overall strength: " + strength)
                        */
                    }
                    
                    // still nothing
                    if (sentiment == "neutral" && valence == 0) {
                        // use the broadest method
                        /*
                        console.log(totals)

                        sentiment = totals.sentiment
                        valence = totals.valence
                        strength = totals.strength

                        console.log("Total sentiment: " + sentiment)
                        console.log("Total valence: " + valence)
                        console.log("Total strength: " + strength)
                        */
                    }

                    // take action
                    if (sentiment) {
                        /*
                        console.log("Tagging image with: predict_" + sentiment)
                        tagImage(which, "predict_" + sentiment)
                        */
                    }

                    if ((valence > 33) && (strength > 10)) {
                        /*
                        console.log("Tagging image with: sentiment_" + sentiment)
                        tagImage(which, "sentiment_" + sentiment)
                        */
                    }

                    if ((valence > 66) && (strength > 10)) {
                        /*
                        console.log("PREDICTION STRENGTH: " + strength)
                
                        // tag it for automatic deletion
                        if (sentiment == "dislike") {
                            console.log("Automatically delete: " + im)
                            tagImage(im, "prefs_delete")
                        } else {
                            console.log("Automatially superlike: " + im)
                            tagImage(im, "prefs_like")
                        }
                        */
                    } 
        
                    if (valence) {
                        // console.log("Tagging image with: sentiment_valence_" + valence)
                        // tagImage(which, "sentiment_valence_" + valence)
                    }

                    if (strength) {
                        // console.log("Tagging image with: sentiment_strength_" + strength)
                        // tagImage(which, "sentiment_strength_" + strength)
                    }
                }
                }
            })
            }
        }
  }