// Web worker, multi-threaded
function YOLOworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting YOLO worker for: ' + which)
            w = new Worker("/bots/yolo_worker.js")

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
                console.log("Stopping YOLO worker: missing HTML element")
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
                        var capt = caption.replace(/caption/,"").replace(".","").replaceAll("<unk>","").toLowerCase()
                       
                        // strip quotes
                        caption = caption.replace(/\"/g,"")
                        caption = caption.replace(/\'/g,"")

                        console.log("YOLO Worker adding caption: '" + capt + "'")

                        var capt2 = "YOLO" + caption.replace(/ /g,"-").replace("caption-","")
                        console.log("YOLO Worker tagging image with: " + capt2)

                        tagImage(which, capt2)

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
