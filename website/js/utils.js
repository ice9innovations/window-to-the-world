banned_words = ["is", "their", "are", "a", "an", "the", "it", "that", "which", "and", "or", "but", "in", "on", "with", "around", "of", "at", "under", "over", "to"]

function toUnicode(text){
    return text.codePointAt(0).toString(16)
  }
  
  function fromUnicode(unicode) {
    //return String.fromCodePoint(unicode)
    return String.fromCodePoint("0x"+unicode);
  }
  
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function stopWorker(worker) {
    if (worker) {
        worker.terminate()
        worker = undefined
    }
}

function replaceWords(phrase) {
    targets = ["woman","women","boys","girls","kids","children","men","man","boy","girl","kid","child","guy"]

    words = phrase.split(" ")
    sentence = []
    for (i in words) {
        word = words[i]

        // only replace whole words
        if (targets.includes(word)){
            word = word.replace("women", "people")
            word = word.replace("woman", "person")
            word = word.replace("boys", "people")
            word = word.replace("girls", "people")
            word = word.replace("kids", "people")
            word = word.replace("children", "people")
            word = word.replace("men", "people")
            word = word.replace("man", "person")
            word = word.replace("boy", "person")
            word = word.replace("girl", "person")
            word = word.replace("kid", "person")
            word = word.replace("child", "person")
            word = word.replace("guy", "person ")
    
            // typo corrections
            word = word.replace("flamings", "flamingos")
            word = word.replace("glass", "cup")
            word = word.replace("brocco", "broccoli")
            word = word.replace("dons", "donuts")
            word = word.replace("girafe", "giraffe")
            word = word.replace("girafs", "giraffes")
            word = word.replace("broccolilili", "broccoli")
            word = word.replace("broccolili", "broccoli")
        }
        sentence.push(word)
    }

    sentence = sentence.join(" ") //.trim
    return sentence
}

function mergeCommonWords(phrase) {
    phrase = phrase.replace(/-/g, " ").replace(/_/g," ")

    phrase = phrase.replace("chops chops", "chops")
    phrase = phrase.replace("hot dog", "hotdog")
    phrase = phrase.replace("hot dogs", "hotdogs")
    phrase = phrase.replace("bow tie", "bowtie")
    phrase = phrase.replace("sports ball", "sportsball")
    phrase = phrase.replace("ski mask", "skimask")
    phrase = phrase.replace("teddy bear", "teddybear")
    phrase = phrase.replace("school bus", "schoolbus")
    phrase = phrase.replace("street sign", "streetsign")
    phrase = phrase.replace("traffic light", "trafficlight")
    return phrase
}

function fadeOut(element) {
    var el = document.getElementById(element)
    el.classList.add("fade")
    setTimer(function() {
        el.style.display = "none"
    }, 1100)
 }