const http = require('http')
const express = require('express')
const app = express()

const hostname = '127.0.0.1'
const port = 8085

const dotenv = require('dotenv')
dotenv.config()

var db_user = process.env.DB_USERNAME
var db_password = process.env.DB_PASSWORD
var db_url = process.env.DB_URL

const { MongoClient, ServerApiVersion } = require('mongodb')
const uri = "mongodb+srv://" + db_user + ":" + db_password + "@" + db_url
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

function toUnicode(text){
  return text.codePointAt(0)
}
  
function fromUnicode(unicode) {
  return String.fromCodePoint(unicode)
}
  
function roundTo(n, digits) {
    var negative = false;
    if (digits === undefined) {
        digits = 0;
    }
    if (n < 0) {
        negative = true;
        n = n * -1;
    }
    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = (Math.round(n) / multiplicator).toFixed(digits);
    if (negative) {
        n = (n * -1).toFixed(digits);
    }
    return n;
}
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
    var user = "*\\\*"
    
    req.params=params(req)
    url_params = req.params

    //console.log(url_params.user)
    if ((url_params.user) && (url_params.user != "")) {
        user = url_params.user
    } 

    //console.log("User: " + user)
    history = false //?

    //console.log("Params:")
    //console.log(url_params)
    var emo = url_params.emoji
    
    if ((emo) && (emo != "")) {
        emo = emo.toLowerCase()
        var aEmo = emo.split(",").sort()

        // filter blank items
        var bEmo = []
        for (var i = 0; i < aEmo.length; i++) {
            var item = aEmo[i]
            if (item) {
                bEmo.push(item)
            }
        }
    
        retrieveFromDatabase(user, bEmo, history, res)
    }

})

async function getImage(client, res, emojis, user, history = false) {
    console.log("Get Image User: " + user)

    var dbo = client.db("window_to_the_world");
    //console.log("Querying database: " + emojis)
        
    total_primary_and = 0
    total_primary_or = 0

    likes_primary_and = 0
    likes_primary_or = 0
    likes_primary_ratio_and = 0
    likes_primary_ratio_or = 0

    dislikes_primary = 0
    dislikes_primary_ratio = 0

    //var q = { "user.name": user, "emoji": emo}
    //var q_like = '{$and:[{"votes.first":"' + emoji + '"},{"actions.keyword": "like"}]}'

    emoji_list_first = "["
    for (var i in emojis) {
        emo = emojis[i]
        if (emo) {
            votes_str = '{"votes.first": "' + emo + '"}'
            emoji_list_first = emoji_list_first + votes_str + ","
        }
    }
    emoji_list_first = emoji_list_first.replace(/,\s*$/, "") // remove trailing comma
    emoji_list_first += "]"

    emo_json_first = JSON.parse(emoji_list_first)

    emoji_list_second = "["
    for (var i in emojis) {
        emo = emojis[i]
        if (emo) {
            votes_str = '{"votes.second": "' + emo + '"}'
            emoji_list_second = emoji_list_second + votes_str + ","
        }
    }
    emoji_list_second = emoji_list_second.replace(/,\s*$/, "") // remove trailing comma
    emoji_list_second += "]"

    emo_json_second = JSON.parse(emoji_list_second)

    //console.log(emo_json)

    var q_total_first_and = {$and: emo_json_first}
    var q_total_first_or = {$or: emo_json_second}
    //console.log(q_total_first_and)
    //console.log(q_total_first_or)

    const images_new = dbo.collection("images_new");
    total_primary_and = await images_new.countDocuments(q_total_first_and)
    total_primary_or = await images_new.countDocuments(q_total_first_or)
    //console.log("Total Emoji Count (first + and): " + total_primary_and)
    //console.log("Total Emoji Count (first + or): " + total_primary_or)

    var q_like_first_and = {$and: [{$and: emo_json_first},{"actions.keyword": "like"},{"user.name": user}]}
    var q_like_first_or = {$and: [{$or: emo_json_second},{"actions.keyword": "like"},{"user.name": user}]}

    likes_primary_and = await images_new.countDocuments(q_like_first_and)
    //console.log("Likes Count (first + and): " + likes_primary_and)

    likes_primary_or = await images_new.countDocuments(q_like_first_or)
    //console.log("Likes Count (first + or): " + likes_primary_or)

    likes_primary_ratio_and = roundTo((likes_primary_and / total_primary_and), 3)
    if (isNaN(likes_primary_ratio_and)) { likes_primary_ratio_and = -1 }
    //console.log("Likes Ratio (and): " + likes_primary_ratio_and)

    likes_primary_ratio_or = roundTo((likes_primary_or / total_primary_or), 3)
    if (isNaN(likes_primary_ratio_or)) { likes_primary_ratio_or = -1 }
    //console.log("Likes Ratio (or): " + likes_primary_ratio_or)

    var q_dislike_first_and = {$and: [{$and: emo_json_first},{"actions.keyword": "dislike"},{"user.name": user}]}
    var q_dislike_first_or = {$and: [{$or: emo_json_second},{"actions.keyword": "dislike"},{"user.name": user}]}

    //var q_dislike = {$and:[{"votes.first": emoji},{"actions.keyword": "dislike"}]}
    dislikes_primary_and = await images_new.countDocuments(q_dislike_first_and)
    //console.log("Dislikes Count (first + and): " + dislikes_primary_and)

    dislikes_primary_or = await images_new.countDocuments(q_dislike_first_or)
    //console.log("Dislikes Count (first + or): " + dislikes_primary_or)

    dislikes_primary_ratio_and = roundTo((dislikes_primary_and / total_primary_and), 3)
    if (isNaN(dislikes_primary_ratio_and)) { dislikes_primary_ratio_and = -1 }
    //console.log("Dislikes Ratio (and): " + dislikes_primary_ratio_and)

    dislikes_primary_ratio_or = roundTo((dislikes_primary_or / total_primary_or), 3)
    if (isNaN(dislikes_primary_ratio_or)) { dislikes_primary_ratio_or = -1 }
    //console.log("Dislikes Ratio (or): " + dislikes_primary_ratio_or)

    emotion = {}
    total = {}

    total.emojis = emojis
    total.primary = total_primary_and
    total.secondary = total_primary_or
    emotion.total = total
    
    emotion_likes = {}
    likes_and = {}
    likes_and.total = likes_primary_and
    likes_and.ratio = likes_primary_ratio_and
    emotion_likes.primary = likes_and

    likes_or = {}
    likes_or.total = likes_primary_or
    likes_or.ratio = likes_primary_ratio_or
    emotion_likes.secondary = likes_or

    emotion.like = emotion_likes

    emotion_dislikes = {}
    dislikes_and = {}
    dislikes_and.total = dislikes_primary_and
    dislikes_and.ratio = dislikes_primary_ratio_and
    emotion_dislikes.primary = dislikes_and

    dislikes_or = {}
    dislikes_or.total = dislikes_primary_or
    dislikes_or.ratio = dislikes_primary_ratio_or
    emotion_dislikes.secondary = dislikes_or

    emotion.dislike = emotion_dislikes
    console.log(emotion)

    returnJSON(emotion, res)
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})

function returnJSON(result, res) {
  //res.setHeader('Content-Type', 'application/json');
  //res.end(JSON.stringify(result))
  res.end(JSON.stringify(result))
}

async function retrieveFromDatabase(user, emoji, history, res){
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */

    //console.log("Retreieve from Database: " + emoji)

    try {
        // Connect to the MongoDB cluster
        await client.connect()
        await getImage(client, res, emoji, user, history)

    } catch (e) {
      console.error(e)
    } finally {
      //client.db().close()
    }
}