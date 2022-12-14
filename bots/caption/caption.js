require('dotenv').config()

const axios = require('axios')
const fs = require('fs')
var express = require('express')
var path = require('path')
const { v4: uuidv4 } = require('uuid')

const hostname = process.env.HOSTNAME
const port = process.env.PORT

var app = express();
app.use(express.static(path.join(__dirname, 'public')))

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
      callName(req, res, filepath)
    });
  });
}



/* ========================================================== 
Upload with multer
============================================================ */
var multer  =   require('multer');
var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/img');
  },
  filename: function (req, file, callback) {
    // callback(null, file.fieldname + '-' + Date.now());
    callback(null, "imagedata");
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

app.post('/upload',function(req,res){
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
    });
});

var server = app.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});

///////////////////////////////////
// PYTHON
///////////////////////////////////

app.get('/process', callName);
 
app.get('/caption', function(req, res) {

  console.log("Request caption")
  req.params=params(req);
  url_params = req.params;
  console.log(req.params.img);

  var ip_from_node = req.ip
  //console.log("IP address: " + ip_from_node)

  var allowedList = process.env.ALLOWED

  if (process.env.ALLOWED) {
  var aList = allowedList.split(",")

  var allowed = false
  for (var i =0; i < aList.length; i++) {
    var ip_from_list = aList[i]
    if (ip_from_node.includes(ip_from_list)) {
      allowed = true
    }
  }
  } else {
    allowed = true
  }

allowed = true

  // only accept requests from known hosts
  if (allowed) {
    if (req.params.img) {
      console.log("Downloading image: " + req.params.img)
      downloadImage(req.params.img, uuidv4(), req, res);
    } else {
      var err = {}
      err.message = "Image parameter is blank"

      console.log(err)
      res.write(JSON.stringify(err))
    }
  } else {
    // inform them politely of their ban
    var err = {}
    err.message = "IP address not on allowed list"

    console.log(err)
    res.end(JSON.stringify(err))
  }

})


function callName(req, res, file="") {
    var output = {}

    var sys = require('util');

    var projectPath = __dirname;  // Users/yujin/Desktop/nodePytonWithNN
    var imagePath = __dirname + "/public/img/imagedata"; // Users/yujin/Desktop/nodePytonWithNN/public/img/image.png

//console.log("python3 ./Python_NN/app_image_caption.py " + projectPath.toString() + " " + imagePath.toString())

    if (file) {
      imagePath = file
    }
    // console.log("projectPath: " + projectPath.toString());
    // console.log("Image Path: " + imagePath.toString());

    var spawn = require("child_process").spawn;
          
    // var process = spawn('python',["./Python_NN/test.py",
    var process = spawn('python3',["./Python_NN/app_image_caption.py",
                                projectPath.toString(),
                                imagePath.toString()] );
 
    process.stdout.on('data', function(data) {
        console.log("\n\nResponse from python: " + data.toString());

        output.caption = data.toString().replace("\n","")
        res.send(JSON.stringify(output))

    fs.unlink(file, (err) => {
      if (err) {
        console.error(err)
        return
      }
    });

    })


}





