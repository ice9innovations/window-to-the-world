require('dotenv').config();

const fs = require('fs');
const http = require('http');
const express = require('express');
const app = express()

const hostname = process.env.HOSTNAME;
const port = process.env.PORT_RETRIEVE;

var db_user = process.env.DB_USERNAME
var db_password = process.env.DB_PASSWORD
var db_url = process.env.DB_URL;

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://" + db_user + ":" + db_password + "@cluster0.huhgg.gcp.mongodb.net/?retryWrites=true&w=majority"
//const uri = "mongodb://" + db_user + ":" + db_password + "@" + db_url + "/?retryWrites=true&w=majority"

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

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
  console.log(req.params.user);

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
  allowed = true // override

  if (allowed) {
    if (req.params.user) {
      retrieveFromDatabase(req.params.user, res);
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

async function getImage(client, usr, res) {
  var dbo = client.db("window_to_the_world");

  var image = {}
  var user = {}
  user.name = usr

  image.user = usr
  var query = {image};

  if (usr == "") { usr = "local" }

  dbo.collection("images").find({"user.name": usr}).sort({timestamp: -1}).limit(1).toArray(function(err, result) {
    if (err) throw err;
    //console.log(result)
    deleteImg(client, result, res)

  });



/*
*/
}

function deleteImg(client, img, res) {
  var dbo = client.db("window_to_the_world");

  console.log(img)
var tmp = img[0]

  if (tmp) {
  
var newID = tmp.guid
console.log(newID)

  //var qImg = img.guid
  var q = { "guid": tmp.guid }
console.log(q)

  dbo.collection("images").deleteOne(q, function(err, res) {
    if (err) throw err;

    console.log("1 document deleted");

  });

} else {
  console.log("GUID not found")
}

  returnJSON(img, res);

}

function returnJSON(result, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result))
}

async function retrieveFromDatabase(usr, res){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */

    var data = {}
    try {
        // Connect to the MongoDB cluster
        await client.connect()
        await getImage(client, usr, res)

    } catch (e) {
      console.error(e);
    } finally {
      //client.db().close()
    }
}

