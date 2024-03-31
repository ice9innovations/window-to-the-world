require('dotenv').config()

const fs = require('fs');
const path = require('path');
const axios = require('axios')
const client = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const sharp = require("sharp");
const sha1 = require('sha1');
const md5 = require('md5');

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

  // check to make sure the ip is on the list
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
      downloadImage(req.params.img, uuidv4(), res);
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
  var dir = './tmp';
  if (!fs.existsSync(dir)){
    console.log("Created tmp directory");
    fs.mkdirSync(dir);
  }

  console.log(`Server running at http://${hostname}:${port}/`);
});

async function downloadImage(url, filepath, res) {
axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

  filepath = "./tmp/" + filepath;
  response.data.pipe(fs.createWriteStream(filepath))
    .on('error', () => {
    // log error and process 
    })
    .on('finish', () => {
      const data = fs.readFileSync(filepath.toString(), 'base64');

      var base64 = data;

      var tmp = {}
      //tmp.sha1 = sha1(data);
      tmp.md5 = md5(data);
      tmp.base64 = base64;

      getMetaData(filepath, res, tmp)
    });
  });
}

function getFileSize(file) {
  var ret = 0;
  try {
    const stats = fs.statSync(file);
    ret = stats.size / 1000; // size in kilobytes

    ret = Math.round(ret)
  } catch (err) {
    console.log(err);
  }

  return ret
}

async function getMetaData(file, res, obj) {

  var meta = {}

  if (obj) {
    // meta.sha1 = obj.sha1;
    meta.md5 = obj.md5;
    //meta.base64 = obj.base64;
  }

  try {

    //var img = "../images/" + file.flower;

    const metadata = await sharp(file).metadata();
    // file.meta = metadata;

    //meta.bin = f;
    //meta.hash = hash;

    meta.filesize = getFileSize(file);

     if (metadata.format) {
      meta.format = metadata.format;
    }

    var dpi = 0
    if (metadata.density) { dpi = metadata.density; }
    meta.dpi = dpi
    meta.width = metadata.width;
    meta.height = metadata.height;

    var mp = (meta.width * meta.height) / 1000000;
    meta.megapixels = Math.round(mp * 100) / 100;

    var qual = "low";
    if (meta.megapixels >= 1) { qual = "medium"; }
    if (meta.megapixels >= 2) { qual = "high"; }

    meta.quality = qual;
    meta.alpha = metadata.hasAlpha;
    meta.channels = metadata.channels;
    meta.space = metadata.space;
    meta.progressive = metadata.isProgressive;

    var wh = meta.width * meta.height;
    var fs = meta.filesize * 1000;
    var ent = wh / fs;
    var entRnd = Math.round(ent);
    meta.complexity = entRnd;

    /*
    if (ent > 0) {
      meta.entropy = Math.round(meta.filesize / ent);
    } else {
      meta.entropy = 0;
    }
    */

    /*
    var colorSet = [...new Set(metaColors)];
    meta.colors = colorSet;
    // clear colors 
    metaColors = [];
    */
    //file.meta = meta;

    if (meta.width > meta.height) {
      meta.display_mode = "landscape";
    }

    if (meta.width < meta.height) {
      meta.display_mode = "portrait";
    }

    if (Math.abs(meta.width - meta.height) <= 100) {
      meta.display_mode = "square";
    }

    // heuristic to detect animated gifs
    if ((meta.format == "gif") && (!(metadata.dpi))) {
      // probably animated
      meta.animated = true
    } else {
      meta.animated = false
    }

  } catch (error) {
    console.log(`An error occurred during processing: ${error}`);
  }

  // try to attach meta data, if not, just send what you got
  getEntropyFromFile(meta, file, res);
}

async function getEntropyFromFile(meta, file, res) {
  var output = {}

  try {

    //var img = "../images/" + file.flower;
    if (file) {

      //console.log(file)
      let raw = fs.readFileSync(file)
      //console.log(raw)
      let freqList = []

      //console.log(`Bytes: ${raw.length}`)
      bytes = raw

      const getEntropy = (bytes) => {
        for (let i = 0; i < 255; i++) {
            let ctr = 0
            for (byte of bytes) {
                if (byte == i) {
                    ctr++
                }
            }
            freqList.push(ctr / bytes.length)
        }
        let ent = 0.0
        for (const [ind, freq] of freqList.entries()) {
            if (freq > 0) {
                ent = ent + (freq * Math.log2(freq))
            }
        }
        ent = -ent
        //console.log('Shannon entropy (min bits per byte-character):')
        //console.log(ent)
        //console.log('Min possible file size assuming max theoretical compression efficiency:')
        //console.log(ent * raw.length)

        meta.shannon = Math.round(ent * 100)
        meta.min_filesize = (Math.round((ent * raw.length) / 10000) * 100) / 100 //kb

        var diff = Math.round(meta.min_filesize / meta.filesize * 1000) / 1000
        diff *= 1000

        meta.information = meta.filesize - meta.min_filesize

        meta.entropy = meta.shannon - diff
        if (meta.entropy < 0) { meta.entropy = 0 }

        console.log(meta)
        output.meta = meta

        // try to attach meta data, if not, just send what you got
        sendData(output, res);

      }

      getEntropy(raw)

    }

  } catch (error) {
    console.log(`An error occurred during processing: ${error}`);
    sendData(output, res);
  }

  try {
    if (fs.existsSync(file)) {
      // delete file
      fs.unlink(file, (err) => {
        if (err) {
          console.error(err)
          return
        }
      });
    }
  } catch(err) {
    //console.log(err);
  }

}


function sendData(file, res) {
  res.writeHead(200);

  floutput = JSON.stringify(file)
  res.end(floutput);

}
