var initialized = false
var watchBuffer, pageTimer, fadeOut

var emojis = []
var resolved_images = []

var lastconf = ""
var lastDM

var deleteCount = 0
var refill = 0

guessJSON = {}

// UTILITY FUNCTIONS
function clearHTML(data, img) {

    var final_el = document.getElementById("guess-final") // first
    var guess_el = document.getElementById("guess") // guessJSON.all
    var cpt_el = document.getElementById("guess-from-caption") // second?

    guess_el.innerHTML = "" 
    cpt_el.innerHTML = ""
    final_el.innerHTML = ""
}

function clearWatcher(timer) {  clearInterval(timer) }

function formatURL(which) {
    var url, iid, tn

    if (!(typeof which) == "string") {
        which = which.id
    }

    var el = document.getElementById(which)
    tn = which.src

    if (!(which.includes("ad-"))) {
        if (which.includes("pd-")) {
            // public domain 
            url = pd_server + "/public_domain/img/" + which.replace("pd-","")
            iid = which.replace("pd-","img-")
        } else {
            url = server + server_path + which + extension
            tn = server + thumbnail_path + which + thumbnail_extension
            iid = "img-" + which
        }
    } else { 
        // it's an ad
        url = "https://img.window-to-the-world.org/img/" + which.replace("ad-","")
        iid = which.replace("ad-","img-")
    }

    // format response in JSON
    var ret = {}
    ret.url = url
    ret.iid = iid 
    ret.tn = tn

    return ret
}

function stopWorker(worker) {
    if (worker) {
        worker.terminate()
        worker = undefined
    }
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}


// INITIALIZATION FUNCTIONS

function init() {
    var files = ["/emojis/emojis4.json"]

    if (!(initialized)) {
        // preload emoji library, then continue
        initialized = true
        preload(files)
    }
}

async function preload(files) {
    var loaded = ""

    for (var i = 0; i < files.length; i++) {
        var file = files[i]

        const response = await fetch(file)
        const json = await response.json()
        
        loaded = json
    }
    
    initAfterPreload(loaded)
}

function initAfterPreload(emojis_from_json) {
    // runs after emoji library is loaded 
    emojis = emojis_from_json
    getImages(INITIAL_BATCH) // should pull from DB now

    fillScreen()
    initialized = true
    
    var lastImg
    /* no 404s anymore because no imgur
    autodelete = setInterval(function() {
        // screen and buffer but anything that
        // makes it into the history stays

        // delete predicted 404s (imgur)
        var predict_404 = document.getElementsByClassName("predict_404")
        for (var i = 0; i < predict_404.length; i++) {
            var tmp = predict_404.item(i)
            tmp.remove()
        }

        // auto delete from buffer
        var buffer_autodelete = windowBuffer.getElementsByClassName("auto_delete")
        for (var i = 0; i < buffer_autodelete.length; i++) {
            var tmp = buffer_autodelete.item(i)
            tmp.remove()
        }

        var screen_autodelete = windowScreen.getElementsByClassName("auto_delete")
        for (var i = 0; i < screen_autodelete.length; i++) {
            var tmp = screen_autodelete.item(i)
            tmp.remove()

            // wiggle with it
            //moveTapeLeft(1)
            //moveTapeRight(1)
        }

        
    }, 1000) */

    var color_set 
    pred_count = setInterval(function() {
        clearHTML()

        if (windowScreen.innerHTML == "") {
            moveTapeLeft(1)
            // reset timer
            //clearWatcher(pageTimer)
            //startPageTimer()
        }

        var cur = getCurrentImage()
        var img = document.getElementById(cur)

        tagImage(cur, "action_shown")
        setPageBackground(cur)

        // get predictions in json format
        var preds = updatePrediction(img, guessJSON)

        if (preds) {
            updateHTML(img, preds.conf)

            var ta = document.getElementById("guess") // textarea
            var col = document.getElementById("colors") // textarea
            
            // create html from colors
            var htmlColors = []
            if (preds.colors) {
                var tmpCls = ""
                var aColors = preds.colors

                for (var i = 0; i < aColors.length; i++) {
                    var c = aColors[i]
                    var div = '<span class="color ' + tmpCls + '" style="background-color: #' + c + '"></span>'
                    htmlColors.push(div)
                }
            }

            // set page background to gray
            
            /* if (preds.colors) {
                var tmpCls = ""
                var aColors = preds.colors

                //var page = document.getElementById("chantilly")
                setPageBackground(cur)

                var rndCol = Math.floor(Math.random() * aColors.length - 1)
                rndCol++ // skip first one
                for (var i = 0; i < aColors.length; i++) {
                    var c = aColors[i]
                    if (c) {
                        c = "#" + c
                    }

                    if (i == 2)  { // rndCol // (aColors.length - 1)    
                        if (cur != color_set) {
                            console.log("Setting background to " + c)
                            page.style.backgroundColor = c
                        }

                        color_set = cur
                    }
                    
                    if (i == 3) {
                        var bc = ""
                        bc = img.style.borderColor
                        bc = bc.replace("#","").toLowerCase()

                        // not red or green
                        if ((bc != "ff0000") && (bc != "00ff00")) {
                            img.style.borderColor = c
                        }
                    }


                }
            } */

            col.innerHTML = htmlColors.join(" ")
            //ta.innerHTML = preds.tags.join(" ")
            //ta.innerHTML = preds.emojis.join(" ")
            guessJSON.objects = preds.emojis
        }

        // get an image from the public domain                    
        var rndPD = Math.floor(Math.random() * 100)
        if (rndPD < PD_RATE) {
            var search_term = getPublicDomainSearchTerm(preds, cur)
            if (search_term) {
                //console.log("Search the public domain for a similar image: " + search_term)
                //PDworker(search_term)
            }

        }

        // backpropagate existing images from the database
        var rndBP = Math.floor(Math.random() * 100)
        if (rndBP < BACKPROP_RATE) {
            var emo = getBackpropagationEmojis(preds, cur) 
            //BACKPROPAGATEworker(emo, username)
        }

    }, REFRESH_RATE)
}


// UI FUNCTIONS

function clearHTML() {

    var final_el = document.getElementById("guess-final") // first
    var guess_el = document.getElementById("guess") // guessJSON.all
    var cpt_el = document.getElementById("guess-from-caption") // second?

    final_el.innerHTML = ""
    guess_el.innerHTML = ""
    cpt_el.innerHTML = ""
}

function updateHTML(img, data) {    
    var final_el = document.getElementById("guess-final") // first
    var guess_el = document.getElementById("guess") // guessJSON.all
    var cpt_el = document.getElementById("guess-from-caption") // second?

    if (data) {

        // show json data in image title (hover)
        img.title = JSON.stringify(data)

        // update HTML element for first place
        var first_place = []

        if (data.first) {
            first_place = cleanArray(data.first)
            if (first_place) { 
                first_place = first_place.join(" ").replace(/,\s*$/, "")
            }
        }

        // update HTML element for second place
        var second_place = []
        if (data.second) {

            second_place = cleanArray(data.second)
            if (second_place) { 
                second_place = second_place.join(" ").replace(/,\s*$/, "")
            }
        }

        // update HTML element for all guesses (hidden)
        var all = []
        if (data.all) {
            all = data.all 
        }

        if ((!(first_place)) && (!(second_place))) {
            second_place = [...new Set(all)]
        }

        if (second_place.length == 1) {
            second_place = []
            first_place = second_place
        }

        guess_el.innerHTML = all 
        cpt_el.innerHTML = second_place
        final_el.innerHTML = first_place
    }
}

function buildAdvertisement(item) {
    var img = new Image()
    var img_id = "img-" + item.ad // "img-" +

    img.onload = function(event) {
        console.log("Testing advertisement: " + event.target.id)
        testImage(event.target.id)
    }
    
    img.id = img_id
    img.src = "https://img.window-to-the-world.org/tn/" + item.ad
    img.classList.add("ad")

    // build link
    var a = document.createElement('a')
    a.href = "javascript: clickImage('" + img_id.replace("img-","ad-") + "')"
    a.id = item.ad //"ad-" + 
    a.classList.add("advertisement")

    // add image to link
    a.appendChild(img)

    // add to test buffer
    //console.log(a)
    windowBuffer.appendChild(a)
}


function buildImage(item) {
    // build image
    var img = new Image()

    img.onload = function(event) {
        // begin image testing
        testImage(event.target.id)
    }

    var path = buildImageHTML(item)   

    img.id = "img-" + path.id
    img.src = path.thumbnail

    // build link
    var a = document.createElement('a')
    a.href = "javascript: clickImage('" + path.id + "')"
    a.id = path.id
    
    // add image to link
    a.appendChild(img)

    // add to test buffer
    buffer.appendChild(a)
    //console.log(a)

    // add event listener to start image testing
    /* var docImg = document.getElementById(img.id)
    docImg.addEventListener('load', (event) => {
        testImage(event.target.id)
    }) // no longer necessary due to fixing the broken code above 
    */ 
}

function buildImageHTML(filename, ads=false) {
    var img = {}

    if (filename) {
        img.id = filename.replace(server,"").replace(server_path,"").replace(extension,"")
        tmp = formatURL(filename)

        //console.log(tmp)

        img.url = server + server_path + filename + extension
        //img.thumbnail = "https://i.imgur.com/" + filename + "b.jpg"

        img.thumbnail = server + thumbnail_path + img.id + thumbnail_extension
        //filename.replace(server,"").replace("//images/","") //+ "b.jpg"
        img.ad = false
    }

    //console.log(img)
    return img
}

function clickImage(which) {
    console.log('Image clicked: ' + which)

    // get json vals back for iid and url
    formattedURL = formatURL(which)

    var el = document.getElementById(formattedURL.iid)

    if ((formattedURL.iid != "screen") && (el)) {
        var cls = el.className
        console.log("Zoom image: " + formattedURL.iid)
        console.log("Advertisement? " + cls.includes("advertisement"))

        if (cls.includes("advertisement")) {
            // handle ads differently
            trackAdImage(which, formattedURL.url)
        } 
        
        // make predictions
        tagImage(formattedURL.iid, "user_zoom predict_zoom predict_delete ")
        //tagImage(iid, "predict_like predict_dislike predict_superlike ")
        // ^ duplicate tags will be ignored

        // prediction is confirmed
        if (cls.includes("user_zoom")) { 
            tagImage(formattedURL.iid, "user_zoom-1") 
            tagImage(formattedURL.iid, "predict_zoom-confirm")
        }
        if (cls.includes("user_zoom-1")) { 
            tagImage(formattedURL.iid, "user_zoom-2") 
        }
        if (cls.includes("user_zoom-2")) { 
            tagImage(formattedURL.iid, "user_zoom-many") 
        }

        // show image to user
        //var imgur = iid.replace("img-","")
        //var url = "https://i.imgur.com/" + imgur + ".jpg"
        zoomImage(which, formattedURL.url)
    
    }
}

function dislikeCurrentImage() {
    var img = getCurrentImage()

    // tag with dislike
    if (img) {
        console.log("Dislike image: " + img)
        tagImage(img, "user_dislike")
    }
    
    // delete image
    var a = windowScreen.getElementsByTagName("a")            
    var el = a[0]
    if (el) {
        //deleteImage(el.id) // note: this function has been removed, tag image with deleted instead
    }
}

function fillScreen() {
    // clear screen
    windowScreen.innerHTML = "" // make sure it's empty
    
    var ready = 0
    if (!(refill)) {
        watchBuffer = setInterval(function() {
            if (ready <= SCREEN_SIZE) {
                var els = document.querySelectorAll(".test .tagged")
                ready = 0 // recount

                for (var i = 0; i < els.length; i++) {
                    var tmp = els[i]
                    ready++
                }
                
            } else {
                // no refills
                console.log("READY: " + ready)
                var els = document.querySelectorAll(".test .tagged")

                var count = 0
                for (var i = 0; i < els.length; i++) {
                    if (count <= SCREEN_SIZE) {
                        var tmp = els[i]
                        tmp.classList.add("move")
                        //tmp.remove()
                    }
                    count++
                }

                var move_els = document.querySelectorAll(".move")
                for (var i = 0; i < move_els.length; i++) {
                    var tmp = move_els[i]
                    windowScreen.append(tmp)
                    tmp.classList.remove("move")

                }

                clearWatcher(watchBuffer)
                refill = 1
            }
        }, 500)
    } else {
        // no refills!
        clearWatcher(watchBuffer)
    }

    //moveTapeWiggle(1)
}

function finalizeImages(aBatch) {
    // Callback: processes images after AJAX load

    for (var i = 0; i < aBatch.length; i++) {
        var item = aBatch[i]
        buildImage(item)
    
    }
}

function getCurrentImage(elem = windowScreen) {
    var ret
    if (elem) {
        var a = elem.getElementsByTagName("a")
        var el = a[0]

        if (el) {
            var imgs = el.getElementsByTagName("img")
            var img = imgs[0]

            if (img) {
                ret = img.id
                //ret = ret.replace("img-","")
            }
        }
    }

    return ret
}

function getTapePosition(which) {
    var cnt = 0
    var ret = 0
    //var img = document.getElementById(which)

    if (windowScreen) {
        
        var screen_links = document.querySelectorAll("#screen A")

        for (var i = 0; i < screen_links.length; i++) {
            var tmp = screen_links.item(i)
            if (which == tmp.id) {
                console.log("Position: " + cnt)
                ret = cnt
            }
            cnt++
        }
    }

    return ret
}

function getTapePositionCls(img) {
    console.log("Get tape position from image: " ) 

    if ((typeof img) == "string") {
        img = document.getElementById(img)
    }

    var ret = 0
    for (var i = 0; i < SCREEN_SIZE; i++) {
        var str = "pos-" + i

        if (img.classList.contains(str)) {
            ret = i
        }
    }

    return ret
}

function generateRandomFiles(num) {
    if (!(num)) { num = 1 }
    
    var f = fetch('/coco/?num=' + num)
    .then(function(response) {
        return response.json()
    })
    .then(function(data) {
        var arrResults = []
        
        for (var i = 0; i < data.length; i++) {

            var tmp = data[i]
            var img = server + server_path + tmp.file
            var tn = server + thumbnail_path + tmp.tn
            
            console.log(server + server_path + img)
            arrResults.push(img)
        }

        //console.log(arrResults)
        //resolve_image(arrResults)
        finalizeImages(arrResults)

    })
}

// get a random filename for Imgur
function generateRandomFilename() {
    var length = 5 // potentially randomize

    var result           = ''
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length

    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }

    return result
}

function getAdvertisement() {

    // get advertisements 
    var rnd = Math.floor(Math.random() * (100))
    if (rnd < AD_RATE) {
        
        // get the current user?
        var img = {}
        var url = "/ice9/"
        
        // cloudy with a chance of ads

        console.log("Requesting advertisement from ad server")

        // serve an advertisement
        var f = fetch(url)
        .then(function(response) {
            return response.json()
        })
        .then(function(data) {
            console.log("Received advertisement")

            var jsonData = data
            //console.log(jsonData)

            if (jsonData) {

                buildAdvertisement(jsonData)

            }
        })
    }
}

function getImages(num = 0, buffer = windowBuffer) {
    if (!(initialized)) { initialized = true }

    // load a buffer of images to test
    var aBatch = []
    aBatch = generateRandomFiles(num)
    //console.log(aBatch)
}

function hideOverlay() { 
    overlay.style.display = "none"
}

function historyFill() {
    console.log("Fill history")

    // check buffer for length, push extra entries to database
    var cnt = 0
    if (deleteCount > 0) {
        //retrieveLastItem(user)
        deleteCount--
    }

    if (deleteCount < 0) { deleteCount = 0 }

    retrieveLastItem()

}

// manage buffers so the app doesn't crash the browser
function overflowHistory() {
    console.log("History Overflow")

    // check buffer for length, push extra entries to database
    var cnt = 0

    var history_links = windowHistory.getElementsByTagName("a")
        var tmp = history_links.item(history_links.length - 1)
        if ((history_links.length - 1) > (SCREEN_SIZE * BUFFER_SCREENS)) { // three pages
            
            // remove first item
            removeLastItem()
        }

}

function overflowSaved() {
    // just delete any extra
    var saved_el = document.getElementById("save")

    var saved_images = saved_el.getElementsByTagName("div")

    for (var i = 0; i < saved_images.length; i++) {
        if (i >= USER_SAVES) {
            tmp = saved_images[i]
            tmp.remove()
        }
    }
}

function insertAtPosition(img, pos) {
    // count positions
    var cnt = 0
    var aPos = []

    // build an array for quick lookup
    var screen_links = document.querySelectorAll("#screen A")
    for (var i = 0; i < screen_links.length; i++) {
        var tmp = screen_links.item(i)
        aPos.push(tmp)
        cnt++ 
    }

    // get the image from the next array
    var nextImage = aPos[pos]

    // move it on to the screen
    windowScreen.insertBefore(img, nextImage)

}

function likeCurrentImage() {
    var img = getCurrentImage()
    if (img) {
        console.log("Like image: " + img)
        tagImage(img, "user_like")
    }

    //moveTapeLeft(1)
}

// Advance the tape:
// move a tested image from buffer to history
// from position 0,0 every interval (speed * 1000ms)
function moveTapeLeft(num) {
    console.log("Move tape to the left")

    var count = 0
    var screen_links = document.querySelectorAll("#screen A")
    for (var i = 0; i < screen_links.length; i++) {
        
        if (count < num) {
            var tmp = screen_links.item(i)

            tmp.classList.add("pos-0") // should take as param
            tmp.classList.add("timestamp-" + new Date().getTime() / 1000)
            windowHistory.prepend(tmp)

            // add to delete count
            deleteCount++

        }
        count++
    }
    
    // advance buffer
    var el = document.getElementById("buffer")
    var buffer_links = el.getElementsByTagName("a")
    
    var bufferCount = 0
    for (var i = 0; i < buffer_links.length; i++) {
        if (i == 0) {
            // first image
            var tmp = buffer_links[0]
            windowScreen.appendChild(tmp)
        }
        //bufferCount++
    }
    
    overflowHistory()

    // replace it with a new image
    getImages(ITERATE)

}

// rewind the tape
// move the most recent image from history to buffer 
// and put it into the correct position
function moveTapeRight(num) {
    var count = 0
    console.log("Move tape to the right")

    //var history = document.querySelectorAll("#history")
    var history_links = windowHistory.getElementsByTagName("A")

    console.log("HISTORY LINKS")
    //console.log(history_links)

    count = 0 //history_links.length // history_links.item.length
    
    // temporarily disable database fill
    historyFill()

    // history repeats itself
    var newCount = 0;
    
    //for (var i = 0; i < history_links.length; i++) {
        var tmp = history_links.item(0) //

        console.log(tmp[0])

        //if (newCount == (count)) { // -1
            
            // remove any other classes
            tmp.classList.remove("faded")
            tmp.classList.remove("user_deleted")

            // get old position
            var pos = getTapePositionCls(tmp)

            // remove all position classes
            for (var i = 0; i < SCREEN_SIZE; i++) {
                var str = "pos-" + i
                if (tmp.classList.contains(str)) {
                    tmp.classList.remove(str)
                }
            }

            // remove all timestamp classes
            for (var i = 0; i < SPEED * 10; i++) {
                var str = "timestamp-" + i
                if (tmp.classList.contains(str)) {
                   tmp.classList.remove(str)
                }
            }

            // insert at that position 
            //windowScreen.prepend(this)
            insertAtPosition(tmp, pos)

            // refresh a new image from the
            // database into the buffer
        //}
        //newCount++
    //}

}

function moveTapeWiggle(num) {
    // preload three images from the past
    moveTapeRight(num)
    moveTapeRight(num)
}

function removeFirstItem() {
    // saves a nested loop, maybe?
    cnt = 0

    var history_links = document.querySelectorAll("#history A")

    for (var i = 0; i < history_links.length; i++) {
        var tmp = history_links.item(i)
        
        if (cnt == 0) {
            var imgData = buildDataModel(tmp.id)
            //saveImage(imgData)
            tmp.remove()
        }
        cnt++
    }
}

function removeLastItem() {
    // saves a nested loop, maybe?
    cnt = 0

    var history_links = windowHistory.getElementsByTagName("a")
    
    for (var i = 0; i < history_links.length; i++) {
        
        if (cnt == (history_links.length - 1)) {
            var tmp = history_links.item(i)
            
            var imgData = buildDataModel(tmp.id)
            saveImage(imgData)

            tmp.remove()
        }
        cnt++
    }
}

function resolve_image(value){
    resolved_images.push(value)
}

function retrieveLastItem() {
    console.log("Get last item from the database")
    // get most recent item from the database
    var url = "/retrieve/retrieve.php?user=" + username                               

    // create an anchor tag 
    // to help with lag
    var placeholderID = uuidv4()
    var a = document.createElement('a')
    a.href = "#" + placeholderID
    a.id = placeholderID
    a.className = "recovered"

    // append it before running the request
    windowHistory.appendChild(a)

    var f = fetch(url)
    .then(function(response) {
        return response.json()
    })
    .then(function(data) {
        var jsonData = data                    
        // console.log(jsonData)

        if (jsonData) {
            //console.log("JSON Data!")

            for (var i = 0; i < jsonData.length; i++) {
                // iterate through because it came from the database
                var obj = jsonData[i]

                //console.log(obj)

                var json_win = obj // JSON.parse(win)

                //console.log(json_win)

                //var idat = win.image_data
                var bin = json_win.binary_image_data
                //console.log("Image Data: " + idat)
                //console.log("Binary Image Data: " + bin)

                if (bin) {

                    //console.log("BINARY")
                    //console.log(bin.toString())

                    //console.log("BASE64")

                    var bin64 = decodeURI(atob(bin))
                    
                    //console.log(bin64)

                    // strip quotes
                    var html = bin64.substring(1, bin64.length - 1)

                    // find the anchor we added earlier
                    var findA = document.getElementById(placeholderID)

                    var append = false
                    if (!(findA)) {
                        // placeholder can't be found
                        append = true
                        findA = document.createElement("a")
                    }
                    findA.href = "javascript: clickImage('" + json_win.file.name + "')"

                    // append the content
                    findA.innerHTML = bin64

                    // update the ID
                    findA.id = json_win.file.name

                    // insert into buffer in the last position
                    // append
                    if (append) {
                        windowHistory.appendChild(findA)
                    }
                }
            }
        }  
    })
}

function resizeZoom(url) {
    // this function does not work
    setTimeout(function() {

        var overlay = document.getElementById("overlay")
        var preview = document.getElementById("preview")
        var img = document.getElementById("img")

        var oW = window.innerWidth
        var oH = window.innerHeight

        var iW = preview.width
        var iH = preview.height
        
        var l = (oW - iW)
        var t = (oH - iH)

        if (iW > oW) { iW = iW * .9 }

        l = (iW / 2) * -1
        t = t / 2

        if (t < 0) { t = "5%" }

        console.log(oW + "," + oH)
        console.log(iW + "," + iH)

        console.log("Left: " + l)
        console.log("Top: " + t)
        
        overlay.style.display = "block"
    }, 400)

}

function reviewLastImage() {
    console.log("REVIEW LAST IMAGE")

    // reset timer
    //clearWatcher(pageTimer)
    //startPageTimer()
    clearHTML()
    
    var img = getCurrentImage()
    if (img) {
        console.log("Review image: " + img)
        tagImage(img, "user_review")
    }

    moveTapeRight(1)
    getAdvertisement()

}

function saveImage(dataModel) {
    console.log("SAVE IMAGE")
    console.log(dataModel)

    if (dataModel) {
       /* var f = fetch('http://192.168.0.32:7900', {
            method: "POST",
            mode: "no-cors",
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: JSON.stringify(dataModel)
        })
        .then(function(data) {
            // { "img": JSON.stringify(dataModel) }
            console.log("POST DATA TO DATABASE")
            console.log(dataModel)
            console.log(data)
        })*/
        
        $.ajax({
            url: "/save/index.php",
            type: "POST",
            dataType:'json',
            data: { "img": JSON.stringify(dataModel) },
            success: function(data){
                        
                console.log("POST DATA TO DATABASE")
                console.log(dataModel)
                console.log(data)
            }
        })
    }
}

function setPageBackground(which) {
    //console.log("PAGE BACKGROUND: " + which)
    //console.log(preds)
    var tile = document.getElementById('tile')
    var el = document.getElementById(which)

    var bkg = ""
    var chosen = false
    var anim = false

    if (!(anim)) {
        bkg = "" // temporary clear
    }

    var img = formatURL(which)

    if (bkg) {
        console.log("BKG: " +bkg)
        tile.style.backgroundImage = 'url("' + bkg + '")'

        if (anim) {
            tile.style.opacity = .2
            tile.style.backgroundRepeat = "no-repeat"
            tile.style.backgroundPosition = "center center"
            tile.style.backgroundSize = "cover"
        } else {
            tile.style.opacity = .05
            tile.style.backgroundRepeat = "repeat"
            tile.style.backgroundPosition = "auto"
            tile.style.backgroundSize = "auto"
        }
    } else { 
        tile.style.backgroundImage = ""
        var img = el.src

        //console.log("IMG:" +img)
        tile.style.backgroundImage = 'url("' + img + '")'

        tile.style.opacity = .11
        tile.style.backgroundRepeat = "no-repeat"
        tile.style.backgroundPosition = "center center"
        tile.style.backgroundSize = "cover"
    }
    
}

function skipCurrentImage() {

    // reset timer
    clearHTML()
    //clearWatcher(pageTimer)
    //startPageTimer()
    
    
    var img = getCurrentImage()

    if (img) {
        console.log("Skip image: " + img)
        tagImage(img, "user_skip")
    }
    
    moveTapeLeft(1)

    img = getCurrentImage()
    updatePrediction(img)

    getAdvertisement()

    // reset timer
    //clearWatcher(pageTimer)
    //startPageTimer()
}

function startPageTimer() {

    // fade out
    fadeOut = setInterval(function() {
        var screenCount = 0
        var screen_links = document.querySelectorAll("#screen A")
        for (var i = 0; i < screen_links.length; i++) {
            var tmp = screen_links.item(i)
            if (screenCount == 0) {
                tmp.classList.add("faded")
            }
            screenCount++
        }
    }, ((SPEED - .5) * 1000))

    // move tape left
    pageTimer = setInterval(function() {
        moveTapeLeft(1)
    }, SPEED * 1000)
}

function superCurrentImage() {
    var img = getCurrentImage()

    if (img) {

        console.log("Superlike image: " + img)
        tagImage(img, "user_superlike")
        moveToSaved(img)
    }
}

function moveToSaved(img) {
    var save = document.getElementById("save")
    var el = document.getElementById(img)

    // new ID who dis?
    var save_el = el
    moveTapeLeft(1)

    div = document.createElement("div");
    div.classList.add("saved")

    var p = el.parentElement
    div.innerHTML = p.outerHTML
    save.prepend(div)

    overflowSaved()

}

function tagImage(img, tags) {
    var image
    var aTags = []

    //console.log("TAG IMAGE: " + img)
    if (img) {
        image = document.getElementById(img)

        if (image) {
            if (tags) {
                aTags = tags.split(" ")

                if (aTags.length > 1) {
                    // multipass
                    for (var i = 0; i < aTags.length -1; i++) {
                        var tag = aTags[i]
                        if (tag) {
                            if (image.classList) {
                                image.classList.add(tag)
                            } else {
                                tagImage(image, tag)
                            }
                        }
                    }
                } else {
                    // single tag
                    var tag = aTags[0]
                    if (tag) {
                        if (image.classList) {
                            image.classList.add(tag)
                        } else {
                            tagImage(image, tag)
                        }
                    }
                }
            }
        }
    }
}

// on image load test the image
function testImage(which) {
    console.log("TEST IMAGE: " + which)

    var img = document.getElementById(which.replace("img-","")) // fixes parent issue below

    if (img) {
        var p = img.parentNode

        // thumbnails from imgur are square
        if (img.height != img.width) { 
            // delete image if blank
            //console.log("Delete image: " + which)
            p.classList.add("predict_404")
        }
        //} else {

            // tags have been applied and will follow the image as it moves
            p.classList.add("tagged")
                
            // Setup tests
            console.log("Run tests on image: " + which)
            
            var del = p.classList.contains("predict_404")

            if (!(del)) {
                // don't run these bots on 
                // images that will get deleted
                //objectBot(which)
                //cocoBot(which)

                CAPTIONworker(which)
                BLIPworker(which)
                YOLOworker(which)
                INCEPTIONworker(which)
                // SNAILworker(which)
                FACEworker(which)
                OCRworker(which)                    
            }

            // run these bots anyway
            //metaBot(which)
            METADATAworker(which, username)

        //}
    }

}

function trackAdImage(which, url) {
    //alert(url)
}

function zoomImage(which, url) {
    // show modal
    var overlay = document.getElementById("overlay")
    var preview = document.getElementById("preview")
    var img = document.getElementById("img")
    
    img.style.backgroundImage = 'url("' + url + '")'
    overlay.style.display = "block"
}
