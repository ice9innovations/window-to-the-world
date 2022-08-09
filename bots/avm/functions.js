var fs = require('fs')
var pluralize = require('pluralize')

var self = module.exports = {

    sentenceCase: function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1)
    },
    readFile: function(file) {
        if (file) {
            var arr
            arr = fs.readFileSync(file).toString().split("\n")

            var filtered = []
            for (i in arr) {
                tmp = arr[i]

                if(arr[i] != "") {
                  arr[i] = tmp.replace("\r","")
                  filtered.push(arr[i])
                }
            }
            return filtered
        }
    },
    writeFile: function (category, word) {
        var directory = "avm"
        var file = self.correctFile(category)

        console.log('writing to file: ' + category)
        if (file) {
          if (word != "") {
            console.log("Writing to training file")
            var writeToFile = "./" + directory + "/" + file + ".txt"

            console.log("Word: " + word)
            console.log("File: " + file)

            var writeWord = "\n" + word.toLowerCase()
            fs.appendFileSync(writeToFile, writeWord)
          }
        }
    },
    correctFile: function(category) {
        var file
        switch(category[0]) {
            case "a":
                file = "animals"
                break
            case "v":
                file = "vegetables"
                break
            case "m": 
                file = "minerals"
                break
            default:
        }

        return file
        //console.log("Corrected file = " + file)
        //self.writeFile(file, data, dir)
    }
}
