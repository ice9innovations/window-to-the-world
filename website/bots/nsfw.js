
function nsfw(which, tagStr) {
    //console.log(tagStr)
    if (tagStr) {

        var url = "/nsfw/nsfw.php?q=" + tagStr.replace(/ /g,",")
        $.get(url, function(data, status){
          if (data) {
      
              var jsonData = JSON.parse(data)
              var tmp = jsonData[0]
              
              if (tmp) {

                var val = tmp.total
                if (!val) { val = 0 }
      
                var valtoInt = Math.ceil(val * 100)
                
                if ((tmp.category == "nsfw") && (valtoInt > 10)) {
                    // greater than 10% chance of being nsfw
                    tagImage(which, "predict_nsfw")
                }
    
                var cat = "content_" + tmp.category + "-" + valtoInt
        
                tagImage(which, cat)
        
                //console.log("NSFW: " + cat)
                //console.log("NSFW DATA: " + JSON.stringify(jsonData))
              }
          }
        })
    }
  }
  