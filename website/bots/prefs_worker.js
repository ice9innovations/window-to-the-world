onmessage = function(event) {
    // the passed-in data is available via e.data
    //console.log("Preference Worker message received")
    var e = event.data

    var user = e.user
    var tags = e.tags

    //prefBot(user, tags)
}

function prefBot(user, emoji_tags) {
    //console.log("OCRBot: " + which)
    var tagStr = ""

    if (emoji_tags != "") {

        var url = "/retrieve_emojis/index.php?user=" + user + "&emoji=" + emoji_tags //.replace("b.jpg",".jpg")
        //console.log("Preference Worker fetching url: " + url)
        fetch(url, {
            mode: 'no-cors',
            method: 'GET',
            headers: {
              Accept: 'application/json',
            }
        })
        .then(response => {
            // Handle data
    
            console.log("Preference Worker received data")
            processResponse(response)
    
        }).catch(error => {
          // Handle error
          postMessage("error")
        })

    }

}

async function processResponse(response) {
    var output_tags = []

    let data = await response.text()

    var jsonData                    
    if (data) {
        if (data != " ") {
            //console.log(data) // show json object
            jsonData = JSON.parse(data)
        }
    }

    if (jsonData) {
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
                //console.log(exact)

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
                // console.log(individual)

                sentiment = individual.sentiment
                valence = individual.valence
                strength = individual.strength

                // console.log("Overall sentiment: " + sentiment)
                // console.log("Overall valence: " + valence)
                // console.log("Overall strength: " + strength)
            }
            
            // still nothing
            if (sentiment == "neutral" && valence == 0) {
                // use the broadest method
                // console.log(totals)

                sentiment = totals.sentiment
                valence = totals.valence
                strength = totals.strength

                // console.log("Total sentiment: " + sentiment)
                // console.log("Total valence: " + valence)
                // console.log("Total strength: " + strength)
            }

            // take action
            if (sentiment) {
                //console.log("Tagging image with: predict_" + sentiment)
                output_tags.push("predict_" + sentiment)
            }

            if ((valence > 33) && (strength > 10)) {
                //console.log("Tagging image with: sentiment_" + sentiment)
                output_tags.push("sentiment_" + sentiment)
            }

            if ((valence > 66) && (strength > 10)) {
                //console.log("PREDICTION STRENGTH: " + strength)
        
                // tag it for automatic deletion
                if (sentiment == "dislike") {
                    //console.log("Automatically delete")
                    output_tags.push("prefs_dislike")
                } else {
                    console.log("Automatially superlike")
                    //output_tags.push("prefs_like")
                }
            } 

            if (valence) {
                //console.log("Tagging image with: sentiment_valence_" + valence)
                output_tags.push("sentiment_valence_" + valence)
            }

            if (strength) {
                //console.log("Tagging image with: sentiment_strength_" + strength)
                output_tags.push("sentiment_strength_" + strength)
            }
        }
    }  
    
    output_tags = [...new Set(output_tags)]
    postMessage(output_tags)
}