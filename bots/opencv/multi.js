require('dotenv').config();

const cv = require('opencv4nodejs')
const fs = require('fs')
const path = require('path')
const client = require('https')
const axios = require('axios')
const http = require('http')
const { v4: uuidv4 } = require('uuid')

const hostname = process.env.HOSTNAME
const port = process.env.PORT_MULTI

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

var url_params;
const server = http.createServer((req, res) => {
  req.params=params(req);
  url_params = req.params;
  //console.log(req.params.img);

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

// start server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})


const classNames = [
  'background',
  'person',
  'bicycle',
  'car',
  'motorcycle',
  'airplane',
  'bus',
  'train',
  'truck',
  'boat',
  'traffic light',
  'fire hydrant',
  'stop sign',
  'parking meter',
  'bench',
  'bird',
  'cat',
  'dog',
  'horse',
  'sheep',
  'cow',
  'elephant',
  'bear',
  'zebra',
  'giraffe',
  'backpack',
  'umbrella',
  'handbag',
  'tie',
  'suitcase',
  'frisbee',
  'skis',
  'snowboard',
  'sports ball',
  'kite',
  'baseball bat',
  'baseball glove',
  'skateboard',
  'surfboard',
  'tennis racket',
  'bottle',
  'wine glass',
  'cup',
  'fork',
  'knife',
  'spoon',
  'bowl',
  'banana',
  'apple',
  'sandwich',
  'orange',
  'broccoli',
  'carrot',
  'hot dog',
  'pizza',
  'donut',
  'cake',
  'chair',
  'couch',
  'potted plant',
  'bed',
  'dining table',
  'toilet',
  'tv',
  'laptop',
  'mouse',
  'remote',
  'keyboard',
  'cell phone',
  'microwave',
  'oven',
  'toaster',
  'sink',
  'refrigerator',
  'book',
  'clock',
  'vase',
  'scissors',
  'teddy bear',
  'hair drier',
  'toothbrush'
];

// replace with path where you unzipped coco-SSD_300x300 model
const ssdcocoModelPath = '/root/opencv_tutorial/models/VGGNet/coco/SSD_300x300/'

const prototxt = path.resolve(ssdcocoModelPath, 'deploy.prototxt')
const modelFile = path.resolve(ssdcocoModelPath, 'VGG_coco_SSD_300x300_iter_400000.caffemodel')

if (!fs.existsSync(prototxt) || !fs.existsSync(modelFile)) {
  console.log('exiting: could not find ssdcoco model')
  console.log('download the model from: https://drive.google.com/file/d/0BzKzrI_SkD1_dUY1Ml9GRTFpUWc/view')
  return
}

function analyze_image(filepath, res) {

  console.log("Analyzing image")
  console.log(filepath)

  var aPreds = []
  var predStr = ""

  try {

    const img = cv.imread(filepath)
    const predictions = classifyImg(img)

    for (var i = 0; i < predictions.length; i++) {
      var p = predictions[i]
      if (p.confidence >= .1) {
        var pred = {}

        pred.object = p.className
        //pred.confidence = Math.round(p.confidence * 100) / 100;
        //pred.confidence = (Math.round(p.confidence * 10) / 10) * 10;
        pred.confidence = (Math.ceil(p.confidence * 100) / 100) * 100

        aPreds.push(pred)
      }
    }
  } catch (error) {
    console.log(error)
  }

  var output = {}
  output.tags = aPreds

  console.log(output)

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

  filepath = "./tmp/" + filepath
  response.data.pipe(fs.createWriteStream(filepath))
    .on('error', () => {
    // log error and process
      var fail = {}
      res.end(fail)
    })
    .on('finish', () => {
      analyze_image(filepath, res)
    })
  })
}

// initialize ssdcoco model from prototxt and modelFile
const net = cv.readNetFromCaffe(prototxt, modelFile);

const classifyImg = (img) => {
  const white = new cv.Vec(255, 255, 255)
  // ssdcoco model works with 300 x 300 images
  const imgResized = img.resize(300, 300)

  // network accepts blobs as input
  const inputBlob = cv.blobFromImage(imgResized)
  net.setInput(inputBlob)

  // forward pass input through entire network, will return
  // classification result as 1x1xNxM Mat
  let outputBlob = net.forward()
  // extract NxM Mat
  outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3])

  const results = Array(outputBlob.rows).fill(0)
    .map((res, i) => {
      const className = classNames[outputBlob.at(i, 1)]
      const confidence = outputBlob.at(i, 2)
      const topLeft = new cv.Point(
        outputBlob.at(i, 3) * img.cols,
        outputBlob.at(i, 6) * img.rows
      )
      const bottomRight = new cv.Point(
        outputBlob.at(i, 5) * img.cols,
        outputBlob.at(i, 4) * img.rows
      )

      return ({
        className,
        confidence,
        topLeft,
        bottomRight
      })
    })

    return results
}
