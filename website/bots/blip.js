// Web worker, multi-threaded
function BLIPworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting BLIP worker for: ' + which)
            w = new Worker("/bots/blip_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {
                var url = el.src.replace("tn/thumb.","")
                if (url) {
                    w.postMessage(url)
                } else {
                    stopWorker(w)
                }
            } else {
                console.log("Stopping BLIP worker: missing HTML element")
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
                        aCapt = caption.split("|")

                        // read emojis
                        caption = aCapt[0]
                        
                        if (aCapt[1]) {
                            emojis = aCapt[1]
                            if (emojis) {
                                aEmo = emojis.split(",")
                                for (var i = 0; i < aEmo.length; i++) {
                                    emo = aEmo[i]
                                    tmp_tag = "BLIPemoji_" + emo
                                    console.log("BLIP Worker tagging image with: " + emo)
                                    tagImage(which, tmp_tag)
                                }
                            }
                        }



                        capt = caption.replace(/caption/,"").replace(".","").replaceAll("<unk>","").toLowerCase()
                       
                        // strip quotes
                        caption = caption.replace(/\"/g,"").replace("\n","")
                        caption = caption.replace(/\'/g,"")

                        console.log("BLIP Worker adding caption: '" + capt + "'")

                        // el.title = capt // el.className

                        var capt2 = "BLIP_" + caption.replace(/ /g,"-").replace("caption-","")
                        console.log("BLIP Worker tagging image with: " + capt)
                        tagImage(which, capt2)

                        // tag image with alt and title
                        var firstLetter = caption.charAt(0)
                        var firstLetterCap = firstLetter.toUpperCase()
                        var remainingLetters = caption.slice(1)
                        var capped = firstLetterCap + remainingLetters

                        //el.alt = capped
                        el.title = capped

                        //predictGenderfromCaption(which)
                    }
                    
                }
            }
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        //caption(which)
    }
}


function caption(which) {
    console.log("captionBot: " + which)

    var tagStr = ""

    var el = buildImageHTML(which.replace("img-",""))

    var elURL = el.url
    var url = "/caption/caption.php?img=" + elURL.replace("b.jpg","b.jpg")
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
                    //el.alt = caption
                    el.alt = caption // el.className

                    //predictGenderfromCaption(which)
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

            var tmpStr = " predict_" + gender.toString()
            var clsn = img.className
            clsn += tmpStr
            img.className = clsn
            
            tagImage(which, tmpStr)
            $(which).addClass(tmpStr)
        }
        
        if (age) {
            //console.log(age)

            var tmpStr = " predict_" + age.toString()
            var clsn = img.className
            clsn += tmpStr
            img.className = clsn

            tagImage(which, tmpStr)  
            $(which).addClass(tmpStr)

        }
    }
  }
