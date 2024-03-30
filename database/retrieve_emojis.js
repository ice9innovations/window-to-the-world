require('dotenv').config();

const fs = require('fs')
const http = require('http')
const express = require('express')
const app = express()

const hostname = '127.0.0.1'
const port = 8087

const dotenv = require('dotenv')
dotenv.config()

var db_user = process.env.DB_USERNAME
var db_password = process.env.DB_PASSWORD

const { MongoClient, ServerApiVersion } = require('mongodb')
const uri = "mongodb+srv://" + db_user + ":" + db_password + "@cluster0.huhgg.gcp.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

var SUPERLIKE_VALUE = 2

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
  req.params=params(req)
  url_params = req.params

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
    if (req.params.emoji) {
      console.log("Getting emoji: " + req.params.emoji)

      var user = req.params.user
      if (user) {

        var emo = req.params.emoji
        if (emo) { emo = emo.toLowerCase() }

        var aEmo = emo.split(",").sort()

        // filter blank items
        var bEmo = []
        for (var i = 0; i < aEmo.length; i++) {
          var item = aEmo[i]
          if (item) {
            bEmo.push(item)
          }
        }

        retrieveFromDatabase(user, bEmo, res)
      } else {
        res.end('{ "err": "No user specified" }') // send blank json back
      }
    } else {
      res.end('{ "err": "No tags provided" }') // send blank json back
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

function getExactMatch(emoji, likes, dislikes, superlikes) {
  var ret = []

  likes = [...new Set(likes)]
  dislikes = [...new Set(dislikes)]
  superlikes = [...new Set(superlikes)]

  var lk = 0
  var dk = 0
  var sk = 0

  //check likes for exact matches
  var exact_lk = 0
  for (var i = 0; i < likes.length; i++) {
    var like = likes[i]

    for (var ii = 0; ii < emoji.length; ii++) {
      var emo = emoji[ii]
      if (like == emo) {
        exact_lk++
      }
    }

    if (emoji.length == exact_lk) {
      lk++
    }
  }

  //check dislikes for exact matches
  var exact_dk = 0
  for (var i = 0; i < dislikes.length; i++) {
    var dislike = dislikes[i]

    for (var ii = 0; ii < emoji.length; ii++) {
      var emo = emoji[ii]
      if (dislike == emo) {
        exact_dk++
      }
    }

    if (emoji.length == exact_dk) {
      dk++
    }
  }
  //check dislikes for exact matches
  var exact_sk = 0
  for (var i = 0; i < superlikes.length; i++) {
    var superlike = superlikes[i]

    for (var ii = 0; ii < emoji.length; ii++) {
      var emo = emoji[ii]
      if (superlike == emo) {
        exact_sk++
      }
    }

    if (emoji.length == exact_sk) {
      sk++
    }
  }

  var exact = {}
  exact.likes = lk
  exact.dislikes = dk
  exact.superlikes = sk

  var item_total = sk + lk + dk
  var lk_adj = (sk * SUPERLIKE_VALUE) + lk

  exact.sentiment = "neutral"
  exact.valence = 0

  if (lk_adj > dk) {
    exact.sentiment = "like"
    exact.valence = lk_adj / item_total
    exact.valence = Math.round(exact.valence * 100) / 100
    exact.strength = item_total
  }

  if (dk > lk_adj) {
    exact.sentiment = "dislike"
    exact.valence = dk / item_total
    exact.valence = Math.round(exact.valence * 100) / 100
    exact.strength = item_total
  }

  return exact
}

function getBreakdownSummary(breakdown) {
  var num_likes = 0
  var num_dislikes = 0
  var bd_like = 0
  var bd_dislike = 0
  var bd_sentiment = "neutral"
  var bd_valence = 0

  var tmp = breakdown
  var ret = {}
  if (tmp) {
    for (var i = 0; i < tmp.length; i++) {
        var b = tmp[i]

        if (b.sentiment == "like") {
            bd_like += b.valence
            num_likes++
        }

        if (b.sentiment == "dislike") {
            bd_dislike += b.valence
            num_dislikes++
        }
    }


    if (bd_like > bd_dislike) {
        bd_sentiment = "like"
        bd_valence = bd_like - bd_dislike
    }

    if (bd_dislike > bd_like) {
        bd_sentiment = "dislike"
        bd_valence = bd_dislike - bd_like
    }

    bd_valence = Math.round(bd_valence * 100) / 100


    var sentiment = bd_sentiment // tmp.sentiment
    var valence = bd_valence / tmp.length // tmp.valence
    if (valence != 100) { valence *= 100 }
    if (valence <- 0) { valence = 0 } // floor at zero
    //if (valence >= 100) { valence = 100 }

    valence = Math.round(valence)

    var summary = {}
    summary.sentiment = sentiment
    summary.valence = valence
    summary.strength = tmp.length

    ret = summary
    console.log("Overall sentiment: " + sentiment)
    console.log("Overall strength: " + valence)
  }

  return ret
}

function getTotals(emoji, likes, dislikes, superlikes) {
  var ret = []

  for (var i = 0; i < emoji.length; i++) {
    var emo = emoji[i]
    emo = emo.toLowerCase()

    var lk = 0
    var dk = 0
    var sk = 0

    // check likes
    for (var ii = 0; ii < likes.length; ii++) {
      var tmp = likes[ii]
      tmp = tmp.toLowerCase()

      if (emo == tmp) {
        lk++
      }
    }

    // check dislikes
    for (var ii = 0; ii < dislikes.length; ii++) {
      var tmp = dislikes[ii]
      tmp = tmp.toLowerCase()

      if (emo == tmp) {
        dk++
      }
    }

    // check superlikes
    for (var ii = 0; ii < superlikes.length; ii++) {
      var tmp = superlikes[ii]
      tmp = tmp.toLowerCase()

      if (emo == tmp) {
        sk++
      }
    }

    var item = {}
    item.emoji = emo
    item.likes = lk
    item.dislikes = dk
    item.superlikes = sk

    var item_total = sk + lk + dk
    var lk_adj = (sk * SUPERLIKE_VALUE) + lk

    item.sentiment = "neutral"
    item.valence = 0

    if (lk_adj > dk) {
      item.sentiment = "like"
      item.valence = lk_adj / item_total
      item.valence = Math.round(item.valence * 100) / 100
      item.strength = item_total
    }

    if (dk > lk_adj) {
      item.sentiment = "dislike"
      item.valence = dk / item_total
      item.valence = Math.round(item.valence * 100) / 100
      item.strength = item_total
    }

    ret.push(item)
  }

  return ret
}

async function getImage(client, res, emoji, user) {
  var dbo = client.db("window_to_the_world");

  console.log("Querying database: " + emoji)
  var output = {}

  var emo = emoji[0]
  if (emoji.length > 0) {
    // build or clause
    var qm = {}
    var ors = []
    for (var i = 0; i < emoji.length; i++) {
      var tmp = {}
      tmp.emoji = emoji[i]
      ors.push(tmp)
    }
  }

  var qOr = "$or"
  qm[qOr] = ors
  //console.log(qm)

  var q = { "user.name": user, "emoji": emo}
  if (emoji.length > 0) {
    var orQ = JSON.stringify(qm)
    orQ = orQ.substring(1) // remove first char
    orQ = orQ.slice(0, -1)

    q = '{ "user.name": "' + user + '",' + orQ + "}"
    q = JSON.parse(q)
  }
  if (user == "all") {
    q = { "emoji": emoji }
  }
  //console.log(q)

  dbo.collection("images").find(q).sort({timestamp: -1}).limit(100).toArray(function(err, result) {
    if (err) throw err;

    var likes = []
    var dislikes = []
    var superlikes = []

    var file_likes = []
    var file_dislikes = []
    var file_superlikes = []

    var all_emojis = []

    for (var i = 0; i < result.length; i++)  {
      var tmp = result[i]

      var emoj = tmp.emoji
      var this_item_emojis = []

      for (var ii = 0; ii < emoj.length; ii++) {
         this_emoji = emoj[ii]
         all_emojis.push(this_emoji)
         this_item_emojis.push(this_emoji)
      }

      var f = tmp.file
      var file = f.name


      // check user actions
      var acts = tmp.actions
      for (var ii = 0; ii < acts.length; ii++) {
        var action = acts[ii]
        switch(action) {
          case "zoom":
          case "like":
            for (var j = 0; j < this_item_emojis.length; j++) {
              likes.push(this_item_emojis[j])
              file_likes.push(file)
            }

            // add weight for matched predictions
            var predictions = tmp.predict
            for (var j = 0; j < predictions.length; j++) {
              var predict = predictions[j]
              if (predict == "like") {
                likes.push(predict)
              }
            }
            break
          case "dislike":
            for (var j = 0; j < this_item_emojis.length; j++) {
              dislikes.push(this_item_emojis[j])
              file_dislikes.push(file)
            }

            // add weight for matched predictions
            var predictions = tmp.predict
            for (var j = 0; j < predictions.length; j++) {
              var predict = predictions[j]
              if (predict == "dislike") {
                dislikes.push(predict)
              }
            }
            break
          case "superlike":
            for (var j = 0; j < this_item_emojis.length; j++) {
              superlikes.push(this_item_emojis[j])
              file_superlikes.push(file)
            }
            break
        }
      }
    }
    var likes_total = likes.length
    var dislikes_total = dislikes.length
    var superlikes_total = superlikes.length

    var likes_adj = likes_total + (superlikes_total * SUPERLIKE_VALUE) // not sure what this should be

    var sentiment = "neutral"
    var total = likes_adj + dislikes_total
    var valence = 0

    if (dislikes_total > likes_adj) {
      sentiment = "dislike"
      valence = likes_adj / dislikes_total
    }

    if (likes_adj > dislikes_total) {
      sentiment = "like"
      valence = dislikes_total / likes_adj
    }

    //prefs.images = result.length
    var prefs = {}
    var details = {}
    var tot = {}

    tot.superlikes = superlikes_total
    tot.likes = likes_total
    tot.dislikes = dislikes_total
    tot.strength = total

    var sl = {}
    sl.total = superlikes_total
    sl.emojis = [...new Set(superlikes)]

    var lk = {}
    lk.total = likes_total
    lk.emojis = [...new Set(likes)]

    var dk = {}
    dk.total = dislikes_total
    dk.emojis = [...new Set(dislikes)]

    details.superlikes = sl
    details.likes = lk
    details.dislikes = dk

    var p = {}
    var emoO = []
    for (var i = 0; i < emoji.length; i++) {
      var tmp = emoji[i]
      var tmpEmo = String.fromCodePoint(parseInt(tmp, 16)).toLowerCase()
      emoO.push(tmpEmo)
    }
    p.emoji = emoO.join(",")
    p.unicode = emoji.join(",")

    tot.sentiment = sentiment
    tot.valence = (Math.round((1 - valence) * 100) / 100)
    p.totals = tot

    var exact = getExactMatch(emoji, likes, dislikes, superlikes)
    p.exact = exact

    var breakdown = getTotals(emoji, likes, dislikes, superlikes)
    p.breakdown = breakdown
    var bd = getBreakdownSummary(breakdown)
    p.individual = bd

    var exact = getExactMatch(emoji, likes, dislikes, superlikes)
    p.details = details
    //p.details = prefs

    all_emojis = [...new Set(all_emojis)]
    p.associated = all_emojis

    output.preference = p
    //output.images = result
    console.log("# of results: " + result.length)

  //console.log(output)
  //console.log(breakdown)

    if (!(output)) {
      output.error = "Output error"
    }
    returnJSON(output, res)

  })
}

function returnJSON(result, res) {
  //res.setHeader('Content-Type', 'application/json');
  //res.end(JSON.stringify(result))
  res.end(JSON.stringify(result))
}

async function retrieveFromDatabase(user, emoji, res){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */

    console.log("Retreieve from Database: " + emoji)

    var data = {}
    try {
        // Connect to the MongoDB cluster
        await client.connect()
        await getImage(client, res, emoji, user)

    } catch (e) {
      console.error(e);
    } finally {
      //client.db().close()
    }
}

