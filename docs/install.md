# Window to the World

## Installation Guide

Installing Window to the World is complicated right now as we do not have a deployment script. We will detail the installation steps below and gradually turn this document into both an installation guide and an installation script.

## Requirements

### For the Dorothy Engine:

*  NodeJS
*  Python
*  OpenCV
*  MongoDB

### Recommended

*  Docker
*  Kubernetes

## To install the Dororthy Engine on a Single Machine 

**Note: This example uses Debian but will work on any distro**

### Clone this repository 

<code>git clone git@github.com:ice9innovations/window-to-the-world.git</code>

### Install NodeJS and NPM

<code>
sudo apt install npm
</code>

### Install PM2:

<code>
npm install pm2 -g 
</code>

### Install and Run the Bots

#### Animal, Vegetable, Mineral

<code>cd bots/avm</code>

<code>npm install</code>

<code>pm2 start avm</code>

#### Caption

<code>sudo apt install python3</code>

<code>cd bots/caption</code>

<code>npm install</code>

<code>pm2 start caption</code>

#### Install the Color Bot

<code>cd bots/color</code>

<code>npm install</code>

<code>pm2 start snail</code>

#### Install the Face Detection Bot

<code>cd bots/face2</code>

<code>npm install</code>

<code>pm2 start face2</code>

#### Install the OCR Bot

<code>cd bots/ocr</code>

<code>npm install</code>

<code>pm2 start ocr</code>

#### Install the OpenCV Object Detector Bots

<code>cd bots/opencv</code>

<code>npm install</code>

<code>pm2 start multi</code>

<code>pm2 start object</code>

To install OpenCV for NodeJS manually, follow these instructions:

https://github.com/justadudewhohacks/opencv4nodejs

Refer to this Stack Overflow discussion if you get stuck:

https://stackoverflow.com/questions/64567610/permission-denied-while-trying-to-install-opencv4nodejs-in-ubuntu

### Create an enviornment file

Copy the .env file into each bot directory. 

<code>sudo nano .env</code>

<code>
HOSTNAME=""
PORT=""
ALLOWED="0.0.0.0,127.0.0.1"
</code>

### Install the database bots

Edit the .env file to include database connection information. Hostname and port is specified in each script. You may install your own MongoDB server or use a MongoDB Cloud Atlas instance.

<code>sudo nano .env</code>

DB_USERNAME=""
DB_PASSWORD=""
ALLOWED="127.0.0.1,178.62.236.25,198.199.97.163,143.198.128.94"

<code>cd bots/database</code>

<code>npm install</code>

<code>pm2 start backpropagate</code>

<code>pm2 start retrieve</code>

<code>pm2 start retrieve_colors</code>

<code>pm2 start retrieve_emojis</code>

<code>pm2 start store</code>

#### Save your PM2 configuration

<code>pm2 save</code>

Make sure the bots will start back on boot

<code>pm2 boot</code>

**This configuration is not recommended for production use**

#### Production Use

Do the same thing but with Docker...

### For the Web Server

*  Linux
*  Apache
*  MySQL
*  PHP

#### Install Apache

<code>sudo apt install apache2</code>

#### Install PHP & Extensions

<code>sudo apt install php</code>

#### Install PHP & Extensions

<code>sudo apt install mysql-server</code>

## Tech Notes 

The choices of languages used were made based on several factors, not the least of which is that I happen to speak all of them (poorly). The most important factor in the technologies selected were their wide availability and ease of use for prototyping. In production, this code would likely be re-written to use something much faster for many of these tasks. The main reason this code is written this way is simply because that's the way I wrote it. I don't make any claims other than "it works" and even that is a stretch most of the time. This is a work in progress and likely will be for some time. Please feel free to make pull requests for anything that bothers you, particularly my use and abuse of semi-colons.
