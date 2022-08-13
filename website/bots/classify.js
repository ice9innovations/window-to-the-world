function CLASSIFYworker(which, tagStr) {
  var w
  if (typeof(Worker) !== "undefined") {
      if (typeof(w) == "undefined") {
          console.log('Starting classify worker for: ' + which)
          w = new Worker("/bots/classify_worker.js")

          var el = buildImageHTML(which.replace("img-",""))
          var el = document.getElementById(which) 
          if (el) {
              var url = el.src 

              if (tagStr) {
                w.postMessage(tagStr)
              } else {
                console.log("Stopping classify worker: missing tags")
                stopWorker(w)
              }
          } else {
            console.log("Stopping classify worker: missing HTML element")
            stopWorker(w)
          }
      }
      w.onmessage = function(event) {
          //console.log("OCR Worker message received")
          //console.log(event.data)
          var tags = event.data
          tags = tags.join(" ")

          console.log("Classify worker adding tags: " + tags)
          tagImage(which, tags)
          stopWorker(this)
      }
  } else {
      console.log("No web worker support, using slower function")
      classify(which, tagStr)
  }
}

function classify(which, tagStr) {
  if (tagStr) {
    //console.log(tagStr)
    var url = "/avm/avm.php?q=" + tagStr

    var im = which.replace("img-","").replace("ad-","")
    var elm = document.getElementById(which)
    var preds = updatePrediction(elm)

    if (preds) {
      var emo_list = preds.emojis

      // tag with emojis
      for (var i = 0; i < emo_list.length; i++) {
        var emo = emo_list[i]
        
        console.log("Adding tag: " + emo)
        tagImage(which, "emoji_" + emo)
      }
      
    }

    $.get(url, function(data, status){
      //console.log(data)
      if (data) {

        // tag image

        var jsonData = JSON.parse(data)
        var tmp = jsonData[0]

        if (tmp) {

          var val = tmp.total
          if (!val) { val = 0 }

          var cat = "avm_" + tmp.category + "-" + Math.ceil(val * 100)
  
          tagImage(which, cat)
          tagImage(which, "avm_" + tmp.category)

          if (tmp.category == "animals") {
            // get the image tags
            var str = getObjectDetectorTags(which)
            //console.log(str)

            // detect what might be in it
            animal(which, str.toString())
          }

          if (tmp.category == "vegtables") {
            // get the image tags
            var str = getObjectDetectorTags(which)
            //console.log(str)

            // detect what might be in it
            vegetable(which, str.toString())
          }

          if (tmp.category == "minerals") {
            // get the image tags
            var str = getObjectDetectorTags(which)
            console.log(str)

            // detect what might be in it
            mineral(which, str.toString())
              
          }


          // console.log("CAT: " + cat)
          // console.log("AVM DATA: " + JSON.stringify(jsonData))
        }
      }
    })
  }
}


function animal() {

}

function vegetable() {

}

function mineral(which, tagStr) {
  console.log(tagStr)
  var url = "/mineral/mineral.php?q=" + tagStr

  $.get(url, function(data, status){
    //console.log(data)
    if (data) {

      var jsonData = JSON.parse(data)
      var tmp = jsonData[0]

      if (tmp) {

        var val = tmp.total
        if (!val) { val = 0 }
        //var cat = "mineral_" + tag + "-" + Math.ceil(val * 100)

        var tag = tmp.category
        if (tag == "all") {
          tag = "allminerals"
          // don't tag it yet
        } else {
          tagImage(which, "minerals_" + tag + "-" + Math.ceil(val * 100))
        }

      }
    }
  })
}

function getObjectDetectorTags(which) {
  // is it a car?
  console.log("Get Object Detector Tags: " + which)

  // get tags
  var el = document.getElementById(which)
  var tagStr = ""

  if (el) {

    var aTags = el.classList
    // console.log(aTags)
  
    for (var i = 0; i < aTags.length; i++) {
        var tag = aTags[i]
        //console.log(tag)
  
        var aTag = tag.split("_")
        var newTag = aTag[1]
        if (aTag[2]) {
          newTag += aTag[2]
        }
  
        if ((aTag[0] == "object") || (aTag[0] == "multi")) {
          tagStr += newTag + ","
          //console.log(newTag)
        }
  
    }
  }
  //console.log(tagStr)
  return tagStr
}