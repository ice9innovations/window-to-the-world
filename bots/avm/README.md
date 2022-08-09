# What is this?

## Animal Vegetable Mineral


This is a very simple demonstration of the power of machine learning. It uses a naive bayesian classifier, a basic machine learning algorithm to determine whether
a word that was entered is an animal, a vegetable, or a mineral.

### Why is it called naive?

Naive Bayesian Classifiers are called naive because they don't know anything when they start, and they're called Bayesian because they were invented by a guy named <a href="https://en.wikipedia.org/wiki/Thomas_Bayes" target="_new">Bayes</a>. Bayesian classifiers start out untrained. This classifier could just as easily classify between three groups of pretty much anything. It doesn't even know the difference between animals, vegetables, and minerals. All it knows is that that they <em>are</em> different.

### How it Works

When you enter a word in the search box, the classifier checkes three files: animals, vegetables, and minerals. The file that has the most entries for that word is the category that is returned. These files contain a list of words that have been entered on this site as well as several libraries of plants and animals that I found on the internet, but it still has a lot to learn!

Your feedback trains the bot!

When you enter a word that the bot doesn't know, instead of guessing, it will ask you whether it is an animal, a vegetable, or a mineral. Your feedback trains the bot and the next time you ask it that question (or someone else does) it may have a better guess than it did the last time. 

If it knows, or if it has a guess, it will tell you it's answer and ask you if it was correct. If it was right (and you tell it that it was right) it will use reinforcement learning to make stronger connections for that guess. If it was wrong you can re-train it to learn the right answer. 

## Installation Instructions

Clone or fork the repo:

git clone https://github.com/adunderwood/avm
                                    
### Install dependencies:

npm init -y

npm install

### Run the tutorial code:

npm start  
