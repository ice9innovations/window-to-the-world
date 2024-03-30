onmessage = function(event) {
    // the passed-in data is available via e.data
    console.log("Preference Worker message received")
    var e = event.data
    console.log("Preference Event Data: " + JSON.stringify(e))
    console.log("Preference User: " + e.user)
    var user = e.user
    var tags = e.tags
    var which = e.id
    userprefs(user, tags, which) //(event.data)
}

async function userprefs(user, emoji_tags, which) {
    console.log(user, emoji_tags)
    console.log("Prefs: " + which)
    var tagStr = ""

    if (emoji_tags != "") {

        var url = "/prefs_bayes/?user=" + user + "&emoji=" + emoji_tags //.replace("b.jpg",".jpg")
        console.log("Preference Worker fetching url: " + url)
        fetch(url, {
            mode: 'no-cors',
            method: 'GET',
            headers: {
              Accept: 'application/json',
            }
        })
        .then(response => {
            // Handle data
            processPrefsResponse(response, which)
    
        }).catch(error => {
          // Handle error
          postMessage("error")
        })
    }

}

async function processPrefsResponse(response, which) {
    let data = await response.text()

    var jsonData
    if (response.text) {
        //console.log(data)
        //console.log("Prefs process response for: " + which)
        jsonData = JSON.parse(data)
        //jsonData = data
            
        //console.log("Preference Data")
        //console.log(data)
        //console.log(jsonData)
        //jsonData = JSON.parse(data)
        //jsonData = data

        //console.log("Prefs adding ID for " + which)
        postMessage([jsonData, which])
        
    } else {
        console.log("Preference Worker error: no data")
    }
}