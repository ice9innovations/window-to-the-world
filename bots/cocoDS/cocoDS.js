require('dotenv').config();

const fs = require("fs");
const path = require("path");

// module dependencies
const http = require('http')

const hostname = process.env.HOSTNAME
const port = process.env.PORT

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
  console.log(req.params.num)

    var f = {}
    fs.readdir("/var/www/html/images/mscoco/", (err, files) => {

    var file_count = 1
    if (req.params.num) {

        file_count = parseInt(req.params.num)
    }

    //console.log(err, files)

    let max = files.length - 1;
    let min = 0;

    var ret = []
    var index, file
    for (var i = 0; i < file_count; i++) {

        var index = Math.round(Math.random() * (max - min) + min);
        file = files[index];

        var dir = "/images/mscoco/"
        f.file = file
        f.tn = "thumb." + file

        console.log("Random file is", file)
        ret.push(f)
        f = {}
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(ret))
});


})

server.listen(port, hostname, () => {
  // create temp folder if it doesn't exist
  console.log(`Server running at http://${hostname}:${port}/`)
})
