function prefs_color(which) {
    var colorTags = []
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
    
                if (tag.includes("color_")) {
                    var tmp = tag.replace("color_","")
                    var aTmp = tmp.split("-")

                    var key = aTmp[0]
                    var val = aTmp[1]

                    if (key == "palette") {
                        colorTags.push(val)
                    }
                }
            }
      
            var jn = colorTags.join(",")
            var url = "/retrieve_colors/index.php?user=demo&color=" + colorTags
    
            console.log("Colors url:")
            console.log(url)
    
            console.log("Predict color preference: ")
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

                        console.log("Exact sentiment: " + sentiment)
                        console.log("Exact valence: " + valence)
                        console.log("Exact strength: " + strength)

                    }       
                    

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

                    }

                    
                    if (valence == 1) { valence = 100 }
                    if (valence < 1) { Math.round(valence *= 100) }
                    if (valence < 0) { valence = 0 }
                    
                    console.log("Total sentiment: " + sentiment)
                    console.log("Total valence: " + valence)
                    console.log("Total strength: " + strength)

                    // take action
                    if (sentiment) {
                        console.log("Tagging image with: sentiment_color_" + sentiment)
                        //tagImage(which, "predict_" + sentiment)
                        tagImage(which, "sentiment_color_" + sentiment)
                    }

                    if ((valence > 33) && (strength > 10)) {
                        //console.log("Tagging image with: sentiment_" + sentiment)
                        //tagImage(which, "sentiment_color_" + sentiment)
                    }

                    if ((valence > 66) && (strength > 10)) {
                        //console.log("PREDICTION STRENGTH: " + strength)
                
                        // tag it for automatic deletion
                        if (sentiment == "dislike") {
                            //console.log("Automatically delete: " + im)
                            //tagImage(im, "prefs_delete")
                        } else {
                            //console.log("Automatially superlike: " + im)
                            //tagImage(im, "prefs_like")
                        }
                    } 
        
                    if (valence) {
                        console.log("Tagging image with: sentiment_color_valence_" + valence)
                        tagImage(which, "sentiment_color_valence_" + valence)
                    }

                    if (strength) {
                        console.log("Tagging image with: sentiment_color_strength_" + strength)
                        tagImage(which, "sentiment_color_strength_" + strength)
                    }
                }
                }
            })
            }
        }
  }