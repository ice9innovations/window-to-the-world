require('dotenv').config();

const cv = require('opencv4nodejs')
const fs = require('fs')
const path = require('path')
const client = require('https')
const axios = require('axios')
const http = require('http')
const { v4: uuidv4 } = require('uuid')

const hostname = process.env.HOSTNAME
const port = process.env.PORT_OBJECT

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
      downloadImage(req.params.img, uuidv4(), res)
    } else {
      var fail = {}
      res.end(fail)
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
  console.log(`Server running at http://${hostname}:${port}/`)
})

function analyze_image(filepath, res) {

  console.log("Analyzing image")
  console.log(filepath)

  var aPreds = {}
  var predStr = ""

  if (filepath) {

  try {

    const img = cv.imread(filepath)
    //  console.log('%s: ', data.label)
    const predictions = classifyImg(img)
    predictions.forEach(p => console.log(p))
    //console.log()

    for (var i =0; i < predictions.length; i++) {
      predStr += " " + predictions[i]
      var tmp = predictions[i]
      tmp = tmp.replace(")","")

      var aTmp = tmp.split(" (")
      var key = aTmp[0]
          key = key.replace(" ", "_")
      var val = parseFloat(aTmp[1])

      //aPreds[key] = (Math.round(val * 10) / 10) * 10
      aPreds[key] = Math.ceil(((val * 100) / 100) * 100)
      }
    } catch (error) {
      console.log(error)
    }
  }

  var output = {}
  output.tags = aPreds

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/json')

  res.end(JSON.stringify(output))

  fs.unlink(filepath, (err) => {
    if (err) {
      console.error(err)
      return
    }
  })
}

async function downloadImage(url, filepath, res) {
axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

  filepath = "./tmp/" + filepath;
  response.data.pipe(fs.createWriteStream(filepath))
    .on('error', () => {
    // log error and process 
    })
    .on('finish', () => {
      analyze_image(filepath, res)
    });
  });
}

if (!cv.modules.dnn) {
  throw new Error('exiting: opencv4nodejs compiled without dnn module');
}

// replace with path where you unzipped inception model
const inceptionModelPath = './';

const modelFile = path.resolve(inceptionModelPath, 'tensorflow_inception_graph.pb');
const classNamesFile = path.resolve(inceptionModelPath, 'imagenet_comp_graph_label_strings.txt');
if (!fs.existsSync(modelFile) || !fs.existsSync(classNamesFile)) {
  console.log('could not find inception model');
  console.log('download the model from: https://storage.googleapis.com/download.tensorflow.org/models/inception5h.zip');
  throw new Error('exiting');
}

// read classNames and store them in an array
const classNames = fs.readFileSync(classNamesFile).toString().split('\n');

// initialize tensorflow inception model from modelFile
const net = cv.readNetFromTensorflow(modelFile);

const classifyImg = (img) => {
  // inception model works with 224 x 224 images, so we resize
  // our input images and pad the image with white pixels to
  // make the images have the same width and height
  const maxImgDim = 224;
  const white = new cv.Vec(255, 255, 255);
  const imgResized = img.resizeToMax(maxImgDim).padToSquare(white);

  // network accepts blobs as input
  const inputBlob = cv.blobFromImage(imgResized);
  net.setInput(inputBlob);

  // forward pass input through entire network, will return
  // classification result as 1xN Mat with confidences of each class
  const outputBlob = net.forward();

  // find all labels with a minimum confidence
  const minConfidence = 0.05;
  const locations =
    outputBlob
      .threshold(minConfidence, 1, cv.THRESH_BINARY)
      .convertTo(cv.CV_8U)
      .findNonZero();

  const result =
    locations.map(pt => ({
      confidence: parseInt(outputBlob.at(0, pt.x) * 100) / 100,
      className: classNames[pt.x]
    }))
      // sort result by confidence
      .sort((r0, r1) => r1.confidence - r0.confidence)
      .map(res => `${res.className} (${res.confidence})`);

  return result;
};
