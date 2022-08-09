require('dotenv').config();

const { v4: uuidv4 } = require('uuid')

const fs = require('fs')
const imageThumbnail = require('image-thumbnail')
const http = require('http')
const axios = require('axios')

const hostname = process.env.HOSTNAME
const port = process.env.PORT_BACKPROP

var db_user = process.env.DB_USERNAME
var db_password = process.env.DB_PASSWORD

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://" + db_user + ":" + db_password + "@cluster0.huhgg.gcp.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const webroot = "/var/www/html"
const tn_dir = webroot + "/tn/" // destination
const img_dir = webroot + "/img/" // destination

const copy_dir = __dirname + "/copy/" // local
const imgs_dir  = __dirname + "/images/" // local 

var filename // global, probably a bad idea

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

async function downloadImage(url, filepath, res) {
axios.get(encodeURI(url), {responseType: "stream"} )
  .then(response => {

  filepath = copy_dir + filepath
  console.log("Downloading file to: " + filepath)
  response.data.pipe(fs.createWriteStream(filepath))
    .on('error', () => {
      // log error and process
      //var fail = {}
      //res.end(fail)
      console.log("Failed to download file. Serving a random image instead.")
      var rnd_img = getRandomImage()
      notify(res, rnd_img)

    })
    .on('finish', () => {
      // generate a unique file name per request
      console.log("File is downloaded, generating thumbnail.")

      // make sure folders exist before using them
      checkDirs()

      // create a thumbnail
      createThumbnail(filepath, res)
    })
  })
}

// check directories and create them if they don't exist
function checkDirs() {
  var webtn = tn_dir
  var webimg = img_dir

  var folders = [webtn, webimg, copy_dir, imgs_dir]
  for (var i = 0; i < folders.length; i++) {
    var dir = folders[i]

    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir)
    }
  }
}

// select a random image file from the images directory
function getRandomImage(dir = (webroot + "/tn/")) {
  var files = fs.readdirSync(dir)
  var img = files[Math.floor(Math.random() * files.length)]

  return img
}

// create a thumbnail for it
async function createThumbnail(img, res) {
  try {
    var options = {}
    //options.responseType = 'base64'
    options.width = 180
    options.height = 180
    options.fit = "cover"

    const thumbnail = await imageThumbnail(img, options)
    var tn_path = __dirname + "/tn/" + filename

    fs.writeFile(tn_path, thumbnail, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("Thumbnail generated, copying files.")
        copyFiles(img, tn_path, res)
      }
    })


  } catch (err) {
    //console.error(err)
    console.log("Thumbnail failed. Serving a random image instead.")
    var rnd_img = getRandomImage()
    notify(res, rnd_img)
  }
}

function copyExistingAd(res) {
  var copy = __dirname + "/copy/"
  var ads  = __dirname + "/images/"

  var rnd = getRandomImage(copy)
  var copy_path = ads + rnd.replace(copy, "")

  // copy to ads directory
  fs.copyFile(rnd, copy_path, (err) => {
    if (err) {
      console.log(err)
    } else {

      // create a thumbnail
      createThumbnail(copy_path, res)
    }
  })
}


// move the image to /var/www/html/ads
// move the thumbnail to image name + b
function copyFiles(img, thumbnail, res) {

  // copy ad to image directory
  console.log("Copying files: ")
  console.log("img: " + img)
  console.log("tn: " + thumbnail)

  console.log("Copying image to: " + img_dir + filename)
 
  fs.copyFile(img, img_dir + filename, (err) => {
    if (err) {
      console.log(err)
    }
  })

  // delete image
  try {
  fs.unlink(img, (err) => {
    if (err) {
    console.error(err)
    }
  })
  } catch(err) {
    console.log("Deleting image")
    console.log(err)
  }

  // copy thumbnail to thumbnail directory
  console.log("Copying thumbnail to: " + tn_dir + filename)

  fs.copyFile(thumbnail, tn_dir + filename, (err) => {
    if (err) {
      console.log(err)
    }
  })

  // delete thumbnail
  console.log("Deleting thumbnail")
  console.log(thumbnail)

  try {
  fs.unlink(thumbnail, (err) => {
    if (err) {
    console.error(err)
    }
  })
  } catch(err) {
    console.log(err)
  }

  // notify user
  notify(res)
}


function notify(res, fn = filename) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')

  var img = {}
  img.image = fn
  res.end(JSON.stringify(img))
}

const server = http.createServer((req, res) => {
  req.params=params(req)

  var qs = {}

  var usr = ""
  usr = req.params.user

  var emoji = ""
  emoji = req.params.emoji

  var valence = 0
  valence = req.params.valence

  qs.user = usr
  qs.emoji = emoji
  qs.valence = valence

  if (!(usr)) {
    qs.user = "demo"
  }

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
    if (qs) {
      console.log("Searching for: " + qs.user)
      retrieveFromDatabase(qs, res)
    }
  } else {
    // inform them politely of their ban
    var err = {}
    err.message = "IP address not on allowed list"

    console.log(err)
    res.end(JSON.stringify(err))
  }
})

  // generate a unique file name per request
  //filename = uuidv4()

  // make sure folders exist before using them
  //checkDirs()

  // get a random image from the ads folder
  //var rnd = getRandomImage()

  // create a thumbnail
  //createThumbnail(rnd, res)

async function retrieveFromDatabase(qs, res){
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
   */

  var data = {}
  try {
      // Connect to the MongoDB cluster
      await client.connect()
      await getImage(client, qs, res)

  } catch (e) {
    console.error(e);
  } finally {
    //client.db().close()
  }
}


function getImageResult(result, res) {
    var r = {}
    if (result) { r = result[0] }
    var e = {}
    e.message = "Error: "

    if (r) {
        // Arrr
        //console.log(r)

        if (r.file ) {
            var f = r.file

            var ret = {}
            ret.name = f.name
            ret.thumbnail = f.thumbnail
            ret.url = f.url

            console.log(ret)
            filename = uuidv4()

            //downloadImage(ret.url, uuidv4(), res) 

            notify(res, ret)

        } else {
            // failure
            e.message += "File not found"
            //console.log("File not found. Serving a random image instead.")
            //var rnd_img = getRandomImage()
            notify(res, e)
        }
    } else {
        // failure
        e.message += "No record results"

        //console.log("Failed to get results. Serving a random image instead.")
        //var rnd_img = getRandomImage()
        notify(res, e)
    }

}

async function getImage(client, qs, res) {
  var dbo = client.db("window_to_the_world");

  var image = {}
  var user = {}
  user.name = qs.user

  var u = qs.user
console.log(u)
  var usr
  if (u) {
    usr = u
  } else {
    usr = "demo"
  }

  var query = {image};

  var emoji = qs.emoji
  if (qs.emoji) {
    // build or clause
    var aEmoji = emoji.split(",")

    var qm = {}
    var ors = []
    for (var i = 0; i < aEmoji.length; i++) {
      var tmp = {}
      tmp.emoji = aEmoji[i]
      ors.push(tmp)
    }

    // build $or query  
    var qOr = "$or"
    qm[qOr] = ors
    
    var orQ = JSON.stringify(qm)
    orQ = orQ.substring(1) // remove first char
    orQ = orQ.slice(0, -1)

    q = '{ "user.name": "' + usr + '",' + orQ + "}"
    q = JSON.parse(q)
  } else {
    // no emoji specified 
    q = '{ "user.name": "' + usr + '" }'
    q = JSON.parse(q)

  }

  console.log(q)

  //console.log(query)
  //  dbo.collection("images").find({ "user.name": usr}).sort({timestamp: -1}).limit(1)
  //q = { "user.name": usr}
  dbo.collection("images").aggregate([
    { $match:  q },
    { $sample: { size: 1 } }
  ]).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result)
    getImageResult(result, res)
  })

}


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
