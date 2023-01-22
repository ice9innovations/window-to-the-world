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

<code>sudo apt install npm</code>

### Install PM2:

<code>npm install pm2 -g</code>

### Install and Run the Bots

#### Animal, Vegetable, Mineral

<code>cd bots/avm</code>

<code>npm install</code>

<code>pm2 start avm</code>

#### Caption

<code>sudo apt install python3</code>

<code>cd bots/caption</code>

<code>mkdir tmp</code>

<code>npm install</code>

<code>pip install nltk</code>

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

##### Install OpenCV from Source #####

Follow this guide: https://linuxhint.com/install-opencv-ubuntu/

or use the following steps:

1. Install gcc7

<code>sudo apt install build-essential</code>

<code>sudo apt -y install gcc-7 g++-7 gcc-8 g++-8 gcc-9 g++-9</code>

<code>sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-7 7</code>

<code>sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-7 7</code>

<code>sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-8 8</code>

<code>sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-8 8</code>

<code>sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-9 9</code>

<code>sudo update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-9 9</code>

<code>sudo update-alternatives --config gcc</code>

- Select gcc7

<code>git clone https://github.com/opencv/opencv.git</code>
  
<code>mkdir -p build && cd build</code>
  
<code>cmake -D CMAKE_BUILD_TYPE=RELEASE \ 
-D CMAKE_INSTALL_PREFIX=/usr/local \ 
-D INSTALL_C_EXAMPLES=ON \ 
-D INSTALL_PYTHON_EXAMPLES=ON \    
-D OPENCV_GENERATE_PKGCONFIG=ON \ 
-D OPENCV_EXTRA_MODULES_PATH=~/opencv/opencv_contrib/modules \ 
-D BUILD_EXAMPLES=ON ..</code>

<code>nproc</code>

<code>make -j[number from nproc minus a couple]</code>

<code>sudo make install</code>

<code>sudo update-alternatives --config gcc</code>

- Select gcc 9 or highest

##### Install the NodeJS services #####

Confirm that OpenCV is installed:

<code>python3 -c "import cv2; print(cv2.__version__)"</code>

Set an environment variable and install opencv4nodejs

Download the model file

<code>wget https://window-to-the-world.org/download/inception5h.zip</code>

<code>wget https://window-to-the-world.org/download/models_VGGNet_coco_SSD_300x300.tar.gz</code>

<code>unzip inception5h.zip</code>

<code>tar -xvf models_VGGNet_coco_SSD_300x300.tar.gz</code>

Create an environment file

<code>nano .env</code>

<code>HOSTNAME=127.0.0.1</code>

<code>PORT_OBJECT=XXXX</code>

<code>PORT_FACE2=XXXX</code>

<code>PORT_FACES=XXXX</code>

<code>PORT_MULTI=XXXX</code>

Start the NodeJS Services

<code>cd bots/opencv</code>

<code>npm init</code>
  
<code>export OPENCV4NODEJS_DISABLE_AUTOBUILD=0</code>

<code>npm install @u4/opencv4nodejs</code>

<code>npm install</code>

<code>pm2 start object.js</code>

<code>pm2 start multi.js</code>

<code>pm2 start faces.js</code>

To install openCV4nodeJS manually, follow these instructions:

https://github.com/justadudewhohacks/opencv4nodejs

Refer to this Stack Overflow discussion if you get stuck:

https://stackoverflow.com/questions/64567610/permission-denied-while-trying-to-install-opencv4nodejs-in-ubuntu

### Create an enviornment file

Copy the .env file into each bot directory. 

<code>sudo nano .env</code>

<code>HOSTNAME=""
PORT=""
ALLOWED="0.0.0.0,127.0.0.1"</code>

#### Install BLIP ####

<code>git clone https://github.com/salesforce/BLIP.git</code>

<code>cd BLIP</code>

<code>cp ~/window-to-the-world/bots/BLIP/server.py ./</code>

<code>wget https://storage.googleapis.com/sfr-vision-language-research/BLIP/models/model_base.pth</code>

<code>pip install timm</code>

<code>pip install fairscale</code>

<code>pip install transformers</code>

<code>sudo nano /var/www/html/inception/index.php</code>

#### Install Inception v3 ####

<code>cp -r window-to-the-world/bots/inception_v3/ ~/</code>

<code>pip install download</code>

<code>pip install tensorflow</code>

<code>./inception.sh</code>
 
<code>sudo nano /var/www/html/inception/index.php</code>

#### Install YOLO v3 ####

<code>git clone https://github.com/WongKinYiu/yolov7p</code>

<code>pip install opencv-pythonp</code>

<code>pip install pandasp</code>

<code>pip install seabornp</code>

<code>pip install scipyp</code>

cp ~/window-to-the-world/bots/yolov7/server.sh ./p</code>

cp ~/window-to-the-world/bots/yolov7/detect-server.py ./p</code>

sudo nano /var/www/html/yolo/index.php</code>

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
