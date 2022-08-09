require('dotenv').config();

const namethatcolor = require('./ntc.js')

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const client = require('https')
const http = require('http')
var onecolor = require('onecolor')
const { v4: uuidv4 } = require('uuid')

const ColorThief = require('color-thief')

const html_colors = require("./colors.json")

const hostname = process.env.HOSTNAME
const port = process.env.port

// get querystring parameters
var params=function(req){
  let q=req.url.split('?'),result={}
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1]
           } catch (e) {
             result[item.split('=')[0]]=''
           }
      })
  }
  return result
}

var url_params
const server = http.createServer((req, res) => {
  req.params=params(req)
  url_params = req.params
  //console.log(req.params.img)

  var ip_from_node = req.socket.remoteAddress

  var allowedList = process.env.ALLOWED
  var aList = allowedList.split(",")

  var allowed = false
  for (var i =0; i < aList.length; i++) {
    var ip_from_list = aList[i]
    if (ip_from_node == ip_from_list) {
      allowed = true
    }
  }

  // only accept requests from known hosts
  if (allowed) {

    if (req.params.img) {
      console.log("Image requested: " + req.params.img)
      downloadImage(req.params.img, uuidv4(), res)
    } else {
      var fail = {}
      res.end(JSON.stringify(fail))
    }
  } else {
    // inform them politely of their ban
    var err = {}
    err.message = "IP address not on allowed list"

    console.log(err)
    res.end(JSON.stringify(err))
  }

})

server.listen(port, hostname, () => {
  // create temp folder if it doesn't exist
  var dir = './tmp'
  if (!fs.existsSync(dir)){
    console.log("Created tmp directory")
    fs.mkdirSync(dir)
  }

  console.log(`Server running at http://${hostname}:${port}/`)
})

async function downloadImage(url, filepath, res) {
var fail = {}

axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

    filepath = "./tmp/" + filepath
    response.data.pipe(fs.createWriteStream(filepath))
      .on('error', () => {
        // log error and process
        var fail = {}
        res.end(JSON.stringify(fail))
      })
      .on('finish', () => {
        getColorData(filepath, res)
      })
    })
  .catch(function(err) {
    var fail = {}
    res.end(JSON.stringify(fail))
    console.log("Error: image not found")
  })
}

var base_colors = []
var base_color_names = []

function getBaseColors() {
  for (var i in html_colors) {
    base_colors.push(html_colors[i])
  }
}

function toGray(vals) {
  var r = vals[0]
  var g = vals[1]
  var b = vals[2]
  return Math.round((Math.min(r, g, b) + Math.max(r, g, b)) / 2)
  // return Math.round((r + g + b) / 3);
  // return Math.round(0.21 * r + 0.72 * g + 0.07 * b);
}

async function getColorData(file, res) {
  colorThief = new ColorThief()

  if (file) {

    var rgb = colorThief.getColor(file)
    var pal = colorThief.getPalette(file)
    var colors = {}
    var palette = []
    var grays = []

    if (rgb) {
      var rgbCode = 'rgb( ' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; // 'rgb(r, g, b)'

      var hex = onecolor(rgbCode).hex()
      var gray = toGray(rgb)
      var grayCode = 'rgb( ' + gray + ',' + gray + ',' + gray + ')'

      var grayHex = onecolor(grayCode).hex()
      var n_match = namethatcolor.ntc.name(hex)
      var nearest = n_match[0]
      var name = n_match[1]

      if (name) {
        name = name.replace(/ /g,"_").toLowerCase()
        colors.name = name
      }

      colors.actual = hex.replace("#","")

      if (nearest) {
        nearest = nearest.replace("#","").toLowerCase()
        colors.nearest = nearest
      }

      colors.gray = grayHex.replace("#","")

    }


    // add palette
    for (var i = 0; i < pal.length; i++) {
      var current = pal[i]

      var rgbCode = 'rgb( ' + current[0] + ',' + current[1] + ',' + current[2] + ')'; // 'rgb(r, g, b)'

      var hex = onecolor(rgbCode).hex()

      var n_match = namethatcolor.ntc.name(hex)
      var nearest = n_match[0]
      var name = n_match[1]

      var tmp = {}

      if (name) {
        name = name.replace(/ /g,"_").toLowerCase()
        tmp.name = name
      }

      tmp.actual = hex

      if (name) {
        nearest = nearest.replace("#","").toLowerCase()
        tmp.nearest = nearest
      }

      var convertGray = toGray(current)
      var tmpCode = 'rgb( ' + convertGray + ',' + convertGray + ',' + convertGray + ')'

      tmpGray = onecolor(tmpCode).hex()
      tmp.gray = tmpGray.replace("#","")

      if (tmp.nearest != colors.nearest) {
        grays.push(tmp.gray)
        palette.push(tmp.nearest)
      }
    }

    // puts first in array
    palette.unshift(colors.nearest)
    grays.unshift(colors.gray)

    // delete file
    fs.unlink(file, (err) => {
      if (err) {
        console.error(err)
        return
      }
    })
  }

  var output = {}
  if (colors) {
    // remove duplicates
    let palette_set = [...new Set(palette)]
    let grays_set = [...new Set(grays)]

    output.colors = colors
    output.palette = palette_set
    output.grayscale = grays_set
  }

  // try to attach meta data, if not, just send what you got
  sendData(output, res)
}


function sendData(file, res) {

  var output = JSON.stringify(file)
  console.log(output)

  res.writeHead(200)
  res.end(output)

}
