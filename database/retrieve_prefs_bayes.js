var dclassify = require('dclassify')

// Utilities provided by dclassify
var Classifier = dclassify.Classifier
var DataSet    = dclassify.DataSet
var Document   = dclassify.Document

const http = require('http')
const express = require('express')
const app = express()

const hostname = '127.0.0.1'
const port = 8086

const dotenv = require('dotenv')
dotenv.config()

var db_user = process.env.DB_USERNAME
var db_password = process.env.DB_PASSWORD
var db_url = process.env.DB_URL

const { MongoClient, ServerApiVersion } = require('mongodb')
const { resourceLimits } = require('worker_threads')
const uri = "mongodb+srv://" + db_user + ":" + db_password + "@" + db_url

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

    var aEmo = []
    var bEmo = []
    if ((emo) && (emo != "")) {
        emo = emo.toLowerCase()
        aEmo = emo.split(",").sort()

        // filter blank items
        for (var i = 0; i < aEmo.length; i++) {
            var item = aEmo[i]
            if (item) {
                bEmo.push(item)
            }
        }
    
        retrieveFromDatabase(user, bEmo, history, res)
    }

})


var liked_primary = []
var liked_secondary = []
var disliked_primary = []
var disliked_secondary = []
var neutral_primary = []
var neutral_secondary = []

function clearArrays() {
    liked_primary = []
    liked_secondary = []
    disliked_primary = []
    disliked_secondary = []
    neutral_primary = []
    neutral_secondary = []
}

function getArray(category, degree) {
    ret = []

    switch (category) {
        case "liked":
            if (degree == "primary") {
                ret = liked_primary
            } else {
                ret = liked_secondary
            }
            break
        case "disliked":
            if (degree == "primary") {
                ret = disliked_primary
            } else {
                ret = disliked_secondary
            }
            break
        case "neutral":
            if (degree == "primary") {
                ret = neutral_primary
            } else {
                ret = neutral_secondary
            }
            break
    }

    return ret
}


function pushEmoji(emo, category, degree) {
    //console.log("Push emoji: " + emo + ", " + category + ", " + degree)
    if (emo) {

        switch (category) {
            case "liked":
                if (degree == "primary") {
                    liked_primary.push(emo)
                } else {
                    liked_secondary.push(emo)
                }
                break
            case "disliked":
                if (degree == "primary") {
                    disliked_primary.push(emo)
                } else {
                    disliked_secondary.push(emo)
                }
                break
            case "neutral":
                if (degree == "primary") {
                    neutral_primary.push(emo)
                } else {
                    neutral_secondary.push(emo)
                }
                break
        }
    }
}

async function getImage(client, res, emojis, user, history = false) {
    console.log("Get Image User: " + user)

    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    var dbo = client.db("window_to_the_world")
    //console.log("Querying database: " + emojis)

    clearArrays()
    const images_new = dbo.collection("images_new")
    images_new.find({"user.name": user}).toArray(function(err, result) {
        if (err) throw err;
        //console.log(result)
        for (var i = 0; i < result.length; i++)  {
            var tmp = result[i]

            //console.log(tmp.votes)
            votes = tmp.votes
            primary = votes.first
            secondary = votes.second

            //console.log(tmp.actions)
            var actions = tmp.actions
            
            for (ii in actions) {
                action = actions[ii]
                action_taken = false

                if (action.keyword == "like") {
                    // push to likes

                    // primary
                    for (var iii in primary) {
                        emo = primary[iii]
                        pushEmoji(emo, "liked", "primay")
                    }

                    // secondary
                    for (var iii in secondary) {
                        emo = primary[iii]
                        pushEmoji(emo, "liked", "secondary")
                    }
                    
                    action_taken = true
                    //console.log("Like")
                    //console.log(tmp.votes)

                }
                if (action.keyword == "dislike") {
                    // push to dislike 
                    action_taken = true

                    // primary
                    for (var iii in primary) {
                        emo = primary[iii]
                        pushEmoji(emo, "disliked", "primay")
                    }

                    // secondary
                    for (var iii in secondary) {
                        emo = primary[iii]
                        pushEmoji(emo, "disliked", "secondary")
                    }

                    //console.log("Dislike")
                    //console.log(tmp.votes)
                }
                if (!(action_taken)) {
                    // push to neutral
                    // primary

                    for (var iii in primary) {
                        emo = primary[iii]
                        pushEmoji(emo, "neutral", "primay")
                    }

                    // secondary
                    for (var iii in secondary) {
                        emo = primary[iii]
                        pushEmoji(emo, "neutral", "secondary")
                    }

                    //console.log("Neutral")
                    //console.log(tmp.votes)
                }
            }
        }
        //output = getPreference(result)
        //returnJSON(output, res)

        var liked_primary = new Document('liked_primary', getArray("liked", "primary"))
        var liked_secondary = new Document('liked_secondary', getArray("liked", "secondary"))

        var disliked_primary = new Document('disliked_primary', getArray("disliked", "primary"))
        var disliked_secondary = new Document('disliked_secondary', getArray("disliked", "secondary"))

        var neutral_primary = new Document('neutral_primary', getArray("neutral", "primary"))
        var neutral_secondary = new Document('neutral_secondary', getArray("neutral", "secondary"))

        var data = new DataSet()
        //console.log(liked_primary)
        //console.log(liked_secondary)

        data.add('good',  [liked_primary, liked_secondary])
        data.add('bad',  [disliked_primary, disliked_secondary])
        //data.add('neutral', [neutral_primary, neutral_secondary])

        // an optimisation for working with small vocabularies
        var options = {
            //applyInverse: true
        }
        
        // create a classifier
        var classifier = new Classifier(options);
        
        // train the classifier
        result = {}
        if ((getArray("liked", "primary").length > 0) || ("liked", "secondary".length > 0) || ("disliked", "primary".length > 0) || ("liked", "secondary".length > 0)) {

            classifier.train(data)
            console.log('Classifier trained.')
            console.log(JSON.stringify(classifier.probabilities, null, 4))
            
            // test the classifier on a new test item
            var testDoc = new Document('emojis', emojis)   
            console.log(emojis)
            var result = classifier.classify(testDoc)
            console.log(result)
        } else {
            console.log("No preference data")
        }

        returnJSON(result, res)
    })

    /*

    emotion = {}
    total = {}

    total.emojis = emojis
    total.primary = total_primary_and
    total.secondary = total_primary_or
    emotion.total = total
    
    emotion_likes = {}
    likes_and = {}
    likes_and.total = likes_primary_and
    emotion_likes.primary = likes_and

    likes_or = {}
    likes_or.total = likes_primary_or
    emotion_likes.secondary = likes_or

    emotion.like = emotion_likes

    emotion_dislikes = {}
    dislikes_and = {}
    dislikes_and.total = dislikes_primary_and
    emotion_dislikes.primary = dislikes_and

    dislikes_or = {}
    dislikes_or.total = dislikes_primary_or
    emotion_dislikes.secondary = dislikes_or

    emotion.dislike = emotion_dislikes
    console.log(emotion)

    */
    //returnJSON(emotion, res)
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