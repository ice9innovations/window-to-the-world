var initialized = false
var page_loaded = 0

var watchBuffer, pageTimer, fadeOut

var emoji_list = []
var resolved_images = []

var lastconf = ""
var lastDM

var deleteCount = 0
var refill = 0

guessJSON = {}

var skiptime = 0
function init() {
    el_img = document.getElementById("img-loading")
    el_src = el_img.src

    loading_image = buildLoadingImage(el_img.src)
    
    //var files = ["/emojis/emojis4.json"]
    t = setTimeout(function() {
        skiptime++
        skipCurrentImage()

        // remove loading image
        loading_img = document.getElementById("loading_image")
        loading_img.parentNode.removeChild(loading_img)
    }, REFRESH_RATE)

    if (!(initialized)) {
        // preload emoji library, then continue
        initialized = true
        preload()
    }

    override = setTimeout(function() {
        var el_loading = document.getElementById("loading")
        el_loading.display = "none"
    }, 12000)

}

async function preload() {
    var loaded = ""

    fetch('/emojis/emojis4.json')
    .then((response) => response.json())
    .then((json) => emoji_list = json)
    
    initAfterPreload(loaded)
}

var lastPrefs = ""
function initAfterPreload(emojis_from_json) {
    // runs after emoji library is loaded 
    lookupEmojis = emojis_from_json
    getImages(INITIAL_BATCH) // should pull from DB now


    //fillScreen()
    initialized = true

    var lastImg
    var runOnce = true
    pred_count = setInterval(function() {

        // run the first time on a delay, then run again as normal
        if (runOnce) {
            wp = setTimeout(function() {
                watchPosition(1) // for preferences
            }, 12000)
            runOnce = false
        } else {
            watchPosition(1) // for preferences
        }
        
        clearHTML()

        if (windowScreen.innerHTML == "") {
            //moveTapeLeft(1)
            // reset timer
            clearWatcher(pt)
            pt = startPageTimer()
        }

        var scr = document.getElementById("screen")
        var cur = getCurrentImage(scr)
        var img = document.getElementById(cur)

        tagImage(cur, "action_shown")
        //setPageBackground(cur)

        preds = buildDataModel(img.id)
        up = updatePrediction(preds)
        //updateHTML(up, preds)
        
        if (preds) {
        
            //console.log(preds)
            up = updatePrediction(preds)
            //console.log(up)
            updateHTML(up, preds)


            votes = preds.votes
            //console.log(votes)

            img_id = img.id
            if (votes) {
                primary = votes.first
                //console.log(preds)
                //console.log(primary)
                if (primary) {

                    //console.log("Primary prefs available for " + img.id)
                    if ((primary.length > 0) && (lastPrefs != img.id)) {
                        console.log("Starting prefs worker for " + img.id)
                        PREFworker(img.id, username)
                        lastPrefs = img.id
                    }
                }
            }
 
            

            var el_loading = document.getElementById("loading")
            if ((preds.caption.blip) || (preds.caption.llama)) {
                if (page_loaded == 0) {
                    delay = setTimeout(function() {
                        page_loaded++
        
                        el_loading.classList.add("fade")
                
                        t = setTimeout(function() {
                            el_loading.style.display = "none"
                        }, 600)
                    }, 18000) // give it a few seconds after it's loaded
                }
            }

        }
       
        skiptime++
    }, 250)
}

function getImages(num = 1, buffer = windowBuffer) {
    if (initialized == true) {
        // load a buffer of images to test
        var aBatch = []
        aBatch = generateRandomFiles(num)
        //console.log(aBatch)
    }
}

function generateRandomFiles(num) {
    if (!(num)) { num = 1 }
    // console.log("Fetching images: " + num)

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
            
            console.log(img)
            arrResults.push(img)
        }

        //console.log(arrResults)
        //resolve_image(arrResults)
        finalizeImages(arrResults)

    })
}

function finalizeImages(aBatch) {
    // Callback: processes images after AJAX load
    console.log("Finalize: " + aBatch)

    for (var i = 0; i < aBatch.length; i++) {
        var item = aBatch[i]
        buildImage(item)
    
    }
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
    windowBuffer.appendChild(a)
    //console.log(a)

    // add event listener to start image testing
    /* var docImg = document.getElementById(img.id)
    docImg.addEventListener('load', (event) => {
        testImage(event.target.id)
    }) // no longer necessary due to fixing the broken code above 
    */ 
}


function buildLoadingImage(src) {
    // build image
    var img = new Image()

    img.onload = function(event) {
        // begin image testing
        testImage(event.target.id)
    }

    var path = buildLoadingImageHTML(src)   

    img.id = "img-" + path.id
    img.src = src

    // build link
    var a = document.createElement('a')
    a.href = "javascript: clickImage('" + path.id + "')"
    a.id = path.id
    
    // add image to link
    a.appendChild(img)

    // add to test buffer
    windowBuffer.appendChild(a)
    //console.log(a)

    // add event listener to start image testing
    /* var docImg = document.getElementById(img.id)
    docImg.addEventListener('load', (event) => {
        testImage(event.target.id)
    }) // no longer necessary due to fixing the broken code above 
    */ 
}

function buildLoadingImageHTML(filename, ads=false) {
    var img = {}

    if (filename) {
        img.id = filename.replace(server,"").replace(server_path,"").replace(extension,"")
        //tmp = formatURL(filename)

        //console.log(tmp)

        //img.url = server + server_path + filename + extension
        console.log("Build image: " + img.url)
        //img.thumbnail = "https://i.imgur.com/" + filename + "b.jpg"

        img.thumbnail = server + thumbnail_path + img.id + thumbnail_extension
        console.log("Build image thumbnail: " + img.thumbnail)

        //filename.replace(server,"").replace("//images/","") //+ "b.jpg"
        img.ad = false
    }

    //console.log("Build image: " + img)

    //console.log(img)
    return img
}

function buildImageHTML(filename, ads=false) {
    var img = {}

    if (filename) {
        img.id = filename.replace(server,"").replace(server_path,"").replace(extension,"")
        tmp = formatURL(filename)

        //console.log(tmp)

        img.url = server + server_path + filename + extension
        console.log("Build image: " + img.url)
        //img.thumbnail = "https://i.imgur.com/" + filename + "b.jpg"

        img.thumbnail = server + thumbnail_path + img.id + thumbnail_extension
        console.log("Build image thumbnail: " + img.thumbnail)

        //filename.replace(server,"").replace("//images/","") //+ "b.jpg"
        img.ad = false
    }

    //console.log("Build image: " + img)

    //console.log(img)
    return img
}

function getCurrentImage(elem = windowScreen) {
    var ret
    //console.log(elem)

    if (elem) {
        var a = elem.getElementsByTagName("a")
        var el = a[0]
        //console.log(el)

        if (el) {
            var imgs = el.getElementsByTagName("img")
            //console.log(imgs)
            var img = imgs[0]
            if (img) {
                ret = img.id
                //ret = ret.replace("img-","")
            }
        }
    }

    //console.log("CURRENT IMAGE: " + ret)
    return ret
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


function clickImage(which) {
    console.log('Image clicked: ' + which)

    // get json vals back for iid and url
    formattedURL = formatURL(which)
    console.log(formattedURL)

    var el = document.getElementById(formattedURL.iid)

    if ((formattedURL.iid != "screen") && (el)) {
        var cls = el.className
        console.log("Zoom image: " + formattedURL.iid)
        console.log("Advertisement? " + cls.includes("advertisement"))

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

        if (cls.includes("advertisement")) {
            // handle ads differently
            trackAdImage(which, formattedURL.url)
            zoomImage(which, formattedURL.url)
        } else {
	    var cocoURL = "https://cocodataset.org/#explore?id="
            var cocoImg = parseInt(which)
            var goto = cocoURL + cocoImg

            window.open(goto)
        } 
        
        // show image to user
        //var imgur = iid.replace("img-","")
        //var url = "https://i.imgur.com/" + imgur + ".jpg"
    
    }
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

    return pageTimer
}


function formatURL(which) {
    var url, iid, tn
    var ret = {}

    if (which) {

        if (!(typeof which) == "string") {
            which = which.id
        }
    
        tn = which.src
        el = document.getElementById(which)
        //console.log("CLICK: " + tn)

        if (tn) {
    
            if (!(which.includes("ad-"))) {
                if (which.includes("pd-")) {
                    // public domain 
                    url = pd_server + "/public_domain/img/" + which.replace("pd-","")
                    iid = which.replace("pd-","img-")
                } else {
                    url = server + server_path + which + extension
                    console.log(url)
                    tn = server + thumbnail_path + which + thumbnail_extension
                    iid = "img-" + which
                }
            } else { 
                // it's an ad
                url = "https://img.window-to-the-world.org/img/" + which.replace("ad-","")
                iid = which.replace("ad-","img-")
            }
        
            // format response in JSON
            ret.url = url
            ret.iid = iid 
            ret.tn = tn
        }
    
    }
    return ret
}


function skipCurrentImage() {
    preds = {}
    if (skiptime > 0) {
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

    //updatePrediction(img)
    //getAdvertisement()

      // reset timer
      //clearWatcher(pageTimer)
      //startPageTimer()
      skiptime = 0
    }
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

    // couldn't you just prepend it instead though?
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
    getImages(ITERATE) // 

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

var prevPrefs = ""
function watchPosition(pos) {
    var cnt = 0
    var ret = 0
    //var img = document.getElementById(which)

    var buf_el = document.getElementById("buffer")

    var buffer_links = buf_el.getElementsByTagName("a")
    var tmp_link = buffer_links[pos]

    if (tmp_link) {
        var tmp_img = tmp_link.getElementsByTagName("img")[0]
        if (tmp_img) {
            if (tmp_img.id != prevPrefs) {

                var preds = buildDataModel(tmp_img.id)
                var up = updatePrediction(preds)

                //console.log(up)
                updateVotesHTML(up, preds)
                
                console.log("Initiate Preferences: " + tmp_img.id)
                PREFworker(tmp_img.id, username)
            }
            prevPrefs = tmp_img.id
        }
    }

    //return ret
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

function retrieveLastItem() {
    console.log("Get last item from the database")
    // get most recent item from the database
console.log("Username: " + username)

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


function removeLastItem() {
    // saves a nested loop, maybe?
    cnt = 0

    var history_links = windowHistory.getElementsByTagName("a")
    //console.log(history_links)
    for (var i = 0; i < history_links.length; i++) {
        
        if (cnt == (history_links.length - 1)) {
            var tmp = history_links.item(i)
            //console.log(tmp)

            if (tmp) {
                if (tmp.id != "loading_image") {
                    anchor = document.getElementById(tmp.id)
                    img = anchor.getElementsByTagName("img")[0]

                    //console.log(img)
                    
                    var imgData = buildDataModel(img.id)
                    //console.log(imgData)
                    saveImage(imgData)
                }
            }

            tmp.remove()
        }
        cnt++
    }
}


function saveImage(model) {
    model.guid = uuidv4()    

    //console.log("SAVE IMAGE")
    //console.log(model)

    if (model) {
        $.ajax({
            url: "/save/index.php",
            type: "POST",
            dataType:'json',
            data: { "img": JSON.stringify(model) },
            success: function(data){
                        
                console.log("POST DATA TO DATABASE")
                console.log(model)
                console.log(data)
            }
        })
    }
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
        tagImage(img, "action_review")
    }

    moveTapeRight(1)
    //getAdvertisement()

}

function superCurrentImage() {
    var img = getCurrentImage()

    if (img) {

        console.log("Superlike image: " + img)
        tagImage(img, "action_superlike")
        moveToSaved(img)
    }
}

function likeCurrentImage() {
    var img = getCurrentImage()
    if (img) {
        console.log("Like image: " + img)
        tagImage(img, "action_like")
    }

    //moveTapeLeft(1)
}

function dislikeCurrentImage() {
    var img = getCurrentImage()

    // tag with dislike
    if (img) {
        console.log("Dislike image: " + img)
        tagImage(img, "action_dislike")
    }
    
    // delete image
    var a = windowScreen.getElementsByTagName("a")            
    var el = a[0]
    if (el) {
        //deleteImage(el.id) // note: this function has been removed, tag image with deleted instead
    }
}

function setPageBackground(which) {
    if (which) {
        //console.log("PAGE BACKGROUND: " + which)

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
    
}