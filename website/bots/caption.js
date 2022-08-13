// Web worker, multi-threaded
function CAPTIONworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting snail worker for: ' + which)
            w = new Worker("/bots/caption_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src
                if (url) {
                    w.postMessage(url)
                } else {
                    stopWorker(w)
                }
            } else {
                console.log("Stopping caption worker: missing HTML element")
                stopWorker(w)
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var caption = event.data
            //var tagStr = tags.join(" ")
            if (caption) { 
                if (caption != " ") {

                    var el = document.getElementById(which)
                    if (el) {                    
                        var capt = caption.replace(".","").replaceAll("<unk>","").toLowerCase()
                       
                        // strip quotes
                        caption = caption.replace(/\"/g,"")
                        caption = caption.replace(/\'/g,"")

                        console.log("Caption Worker adding caption: '" + capt + "'")

                        el.alt = capt
                        el.title = capt // el.className

                        var capt2 = "caption_" + caption.replace(/ /g,"-")
                        console.log("Caption Worker tagging image with: " + capt2)

                        tagImage(which, capt2)

                        //predictGenderfromCaption(which)
                    }
                    
                }
            }
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        caption(which)
    }
}

function caption(which) {
    console.log("captionBot: " + which)

    var tagStr = ""

    var el = buildImageHTML(which.replace("img-",""))

    var elURL = el.url
    var url = "/caption/caption.php?img=" + elURL //.replace("b.jpg",".jpg")                            
    $.get(url, function(data, status){
        var jsonData

        if (data) {
            jsonData = JSON.parse(data);
        }

        if (jsonData) {
            var caption = jsonData.caption.toString()
            caption = caption.replaceAll(".","").replaceAll("<unk>","").replaceAll(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '').replaceAll("  ", " ").toLowerCase()
            
            if (caption) {

                // apply tags to image
                // tagImage(which, "caption_" + caption)

                var el = document.getElementById(which)
                if (el) {                    
                    var capt = jsonData.caption.replace(".","").replaceAll("<unk>","").toLowerCase()
                    console.log("Adding caption: " + "caption_" + caption)
                    el.alt = caption
                    el.title = caption // el.className

                    predictGenderfromCaption(which)
                }

            }

        }  
    })


    tagStr = ""
}


function predictGenderfromCaption(which) {
    var img = document.getElementById(which)
    //console.log("PREDICT GENDER FROM CAPTION")
    
    if (img) {
        var alt = img.alt 
  
        //console.log(alt)

        var gender = ""
        var age = ""
        if (alt) {
    
          // gender starts with man because 'woman' contains 'man'
          if (alt.includes("man") || (alt.includes("men"))) { 
            gender = "male" 
          }
    
          if ((alt.includes("women")) || (alt.includes("woman") || (alt.includes("girl")))) {
              gender = "female"
          }
    
          if (alt.includes("boy")) {
              gender = "male"
          }
    
          // women and mixed groups
          if ((alt.includes("people")) || (alt.includes("man and a woman"))) {
              // gender = "unknown_gender"
          }
    
          // neutral for mixed groups
          if ((alt.includes("girl")) && (alt.includes("boy"))) { 
            gender = "mixed_gender"
          }
    
          // age
          if ((alt.includes("woman")) || (alt.includes("man"))) { 
            age = "adult"
          }
      
          if ((alt.includes("young")) || (alt.includes("child")) || (alt.includes("girl")) || (alt.includes("boy")) || (alt.includes("baby"))) {
            if (!(age)) {
                age = "child"
    
                if (alt.includes("young")) {
                    age = "young"
                }
    
                if (alt.includes("baby")) {
                    age = "baby"
                }
                
            } else {
                //age = "mixed_ages"
            }
          }
        }

        if (gender) {
            //console.log(gender)

            var tmpStr = " caption_" + gender.toString()
            var clsn = img.className
            clsn += tmpStr
            img.className = clsn
            
            tagImage(which, tmpStr)
            $(which).addClass(tmpStr)
        }
        
        if (age) {
            //console.log(age)

            var tmpStr = " caption_" + age.toString()
            var clsn = img.className
            clsn += tmpStr
            img.className = clsn

            tagImage(which, tmpStr)  
            $(which).addClass(tmpStr)

        }
    }
  }