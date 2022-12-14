require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios')
const client = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const tesseract = require("node-tesseract-ocr")

const hostname = process.env.HOSTNAME;
const port = process.env.PORT;

// get querystring parameters
var params=function(req){
  let q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach((item)=>{
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

var url_params;
const server = http.createServer((req, res) => {
  req.params=params(req);
  url_params = req.params;
  //console.log(req.params.img);

  var ip_from_node = req.socket.remoteAddress

  var allowedList = process.env.ALLOWED

  if (process.env.ALLOWED) {
  var aList = allowedList.split(",")

  var allowed = false
  for (var i =0; i < aList.length; i++) {
    var ip_from_list = aList[i]
    if (ip_from_node == ip_from_list) {
      allowed = true
    }
  }
  } else {
    allowed = true
  }

  // only accept requests from known hosts
  if (allowed) {
    if (req.params.img) {
      downloadImage(req.params.img, uuidv4(), req, res);
    }
  } else {
    // inform them politely of their ban
    var err = {}
    err.message = "IP address not on allowed list"

    console.log(err)
    res.end(JSON.stringify(err))
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

async function downloadImage(url, filepath, req, res) {
axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

  filepath = "./tmp/" + filepath;
  response.data.pipe(fs.createWriteStream(filepath))
    .on('error', () => {
    console.log("error")
    // log error and process
    })
    .on('finish', () => {
      console.log("Image downloaded")
      readOCR(filepath, res)
    });
  });
}


const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
}


function readOCR(img, res) {
console.log(img)

  tesseract
    .recognize(img, config)
    .then((text) => {
      console.log("OCR output: ", text)
      sendData(text, res)
    })
    .catch((error) => {
console.log("ERROR")
      console.log(error.message)
    })
}

function sendData(file, res) {
  var txt = file
  var output = {}

  if (txt) {
    var ret = "false"

    // remove new lines and spaces
    txt = txt.replace(/(\r\n|\n|\r)/gm, "").replace("\t","").replace("\f","")

    // strip punctuation
    txt = txt.replace(/[.,\/#\'\"!@‘¥$¢€©®°?«»%`’“”—\^&\<\>|\*;:{}=\-_`~\[\]()]/g,"").toLowerCase()

    if (txt.replace(" ","").length > 1) { ret = "true" }

    output.ocr = ret
    output.text = txt
  }

  floutput = JSON.stringify(output)

  res.setHeader('Content-Type', 'application/json')
  res.writeHead(200)
  res.end(floutput)

}
