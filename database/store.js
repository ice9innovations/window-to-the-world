require('dotenv').config();

const formidable = require('formidable')
const { parse } = require('querystring')
const qs = require('querystring')
const fs = require('fs')
const http = require('http')

const hostname = process.env.HOSTNAME
const port = process.env.PORT_STORE

var db_user = process.env.DB_USERNAME
var db_password = process.env.DB_PASSWORD
var db_url = process.env.DB_URL // huhgg.gcp.mongodb.net

const { MongoClient, ServerApiVersion } = require('mongodb')
//const uri = "mongodb+srv://" + db_user + ":" + db_password + "@cluster0.huhgg.gcp.mongodb.net/?retryWrites=true&w=majority"
const uri = "mongodb://" + db_user + ":" + db_password + "@" + db_url + "/?retryWrites=true&w=majority"

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

parseMultipart = function(request) {

    // Convert the chunks to string
    var str = request.chunks.toString();

    // Get the boundry out pf header
    var boundry = '--' + request.headers["content-type"].substring(request.headers["content-type"].indexOf('=')+1, request.headers["content-type"].length);

    // Initialization
    var request_data = {};
    index = 0;


    // For each form element, store the value in request_data
    while (str.indexOf(boundry, index) != -1) {
        index += boundry.length;
        i = str.indexOf(" name=\"",index);
        j = str.indexOf("\"",i+7);
        name = str.substring(i+7,j);
        var value = {};
        if (str.charAt(j+1)==';') {
            value["type"] = "file";
            i = j + 3;
            j = str.indexOf("\"",i+14);
            filename = str.substring(i+10, j);
            value["filename"] = filename;
            i = j + 17;
            j = str.indexOf("\r", i);
            contentType = str.substring(i, j);
            value["content-type"] = contentType;
            i = j + 4;
            j = str.indexOf("\n\r\n" + boundry, i);
            fileContent = str.substring(i, j);
            value["content"] = fileContent;
        } else {
            value["type"] = "field";
            i = j + 5;
            j = str.indexOf("\r\n" + boundry,i);
            value["content"] = str.substring(i,j);
        }
        index = str.indexOf(boundry, index) + 2;
        request_data[name] = value;
    }
    return request_data;
}



var url_params;
var resultData;
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
      if (err) {
        res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
        res.write(String(err));
        return;
      }

      console.log(fields);

      // this is the only part of this code that actually does anything
      //console.log(fields.img);

      var ip_from_node = req.socket.remoteAddress
/*
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
*/
        if (fields.img) {
          saveToDatabase(fields.img);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ fields, files }, null, 2));
  //    } else {
        // inform them politely of their ban
  //      var err = {}
  //      err.message = "IP address not on allowed list"

  //      console.log(err)
  //      res.write(JSON.stringify(err))
  //    }
    });


    collectRequestData(req, result => {

if (result) {

//resultData += result;
//console.log(result.img)

//console.log(parseMultipart(result))

//          if (result["test"]) {
//            console.log(result["test"]);
//          }
        }
      });
  }

  var body = ""
  var chunky = []
  req.on('data', function(chunk) {
    body += chunk;
    chunky.push(chunk);
  });

  req.on('end', function() {
    //console.log("BODY: " + body)
    var jsb = parse(body)
    //console.log(jsb)

//console.log(resultData)

var post = parse(body)//
//console.log(qs.parse(post))



    res.writeHead(200)
    res.write(body)
  })

//    downloadImage(req.params.img, uuidv4(), res);

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

function collectRequestData(request, callback) {
    const FORM_URLENCODED = 'application/x-www-form-urlencoded';
    if(request.headers['content-type'] === FORM_URLENCODED) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback(parse(body));
        });
    }
    else {
        callback(null);
    }
}

async function insertImage(client, img) {
  var dbo = client.db("window_to_the_world");
  var strImg = img
  img = JSON.parse(img)

  /*
  if (img) {

    console.log("INSERT: " + img)

    var obj = {}
    obj.guid = img.guid
    obj.timestamp = (new Date().getTime() / 1000)
    obj.img = strImg

    if (img.user) {
      obj.user = img.user.name
      obj.email = img.user.email
    }

    if (img.action) { obj.action = img.action }
    if (img.color) { obj.color = img.color }
    if (img.faces) { obj.faces = img.faces }
    if (img.file) { obj.file = img.file }
    if (img.meta) { obj.meta = img.meta }
    if (img.multi) { obj.multi = img.multi }
    if (img.objects) { obj.objects = img.objects }
    if (img.palette) { obj.palette = img.palette }
    if (img.text) { obj.text = img.text }
  }
*/
    dbo.collection("images").insertOne(img, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      //console.log(obj);
    });
}

async function saveToDatabase(img){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */

console.log("save to database")
console.log(img)

    var data = {}
    try {
        // Connect to the MongoDB cluster
        await client.connect()
        await insertImage(client, img)

    } catch (e) {
        console.error(e);
    } finally {
    //client.close()
    }
}

