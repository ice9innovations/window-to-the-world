
// Web worker, multi-threaded
function FACEworker(which) {
    var w
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            console.log('Starting face worker for: ' + which)
            w = new Worker("/bots/face_worker.js")

            var el = buildImageHTML(which.replace("img-",""))
            var el = document.getElementById(which) 
            if (el) {

                var url = el.src
                w.postMessage(url)
                
            } else {
                console.log("Stopping face worker: missing HTML element")
            }
        }
        w.onmessage = function(event) {
            //console.log("OCR Worker message received")
            //console.log(event.data)
            var tags = event.data
            var tagStr = tags.join(" ")
            if (tagStr) { 
                if (tags != " ") {
                    console.log("Face Worker tagging image with: " + tagStr)
                    tagImage(which, tagStr)

                }
            }
            stopWorker(w)
        }
    } else {
        console.log("No web worker support, using slower function")
        faceBot(which)
    }
}

function faceBot(which) {
    //console.log("FaceBot: " + which)

    var tagStr = ""

    //var el = buildImageHTML(which.replace("img-",""))
    var el = document.getElementById(which)
    var elURL = el.src
    //var url = "/faces/faces.php?img=" + elURL //.replace("b.jpg",".jpg")
    var url = "/faces2/?img=" + elURL //.replace("b.jpg",".jpg")

    $.get(url, function(data, status) {
        var jsonData
        
        if (data) {
            jsonData = JSON.parse(data);
        }

        if (jsonData) {
            var faces = jsonData.faces
            if (faces == "undefined") {
                faces = null
            }

            var tagStr = "faces_" + faces

            console.log("Adding tag: " + tagStr)
            tagImage(which, tagStr)

            var preds = updatePrediction(which)
            if (preds) {
                var emo_list = preds.emojis

                // tag with emojis
                for (var i = 0; i < emo_list.length; i++) {
                    var emo = emo_list[i]
                    
                    console.log("Object Worker Adding tag: " + emo)
                    tagImage(which, "emoji_" + emo)
                }

                            
                // check preferences
                PREFworker(which)
            }

            /*
            if ((parseInt(faces) > 0) && (parseInt(faces) < 2)) {
                console.log("Adding tag: predict_face")
                tagImage(which, "predict_face")

                tagImage(which, "predict_animals")
                tagImage(which, "predict_person")
            }

            if (parseInt(faces) > 1) {
                console.log("Adding tag: predict_people")
                //tagImage(which, "predict_face")
                tagImage(which, "predict_faces")

                tagImage(which, "predict_animals")
                //tagImage(which, "predict_person")
                tagImage(which, "predict_people")
            }
            */
        }                    
    }) 

}