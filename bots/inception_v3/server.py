import http.server
import json
import requests
import torch

from urllib.parse import urlparse, parse_qs

import sys
from PIL import Image

import socketserver # Establish the TCP Socket connections

import matplotlib.pyplot as plt
import tensorflow as tf
import numpy as np
import os
import io
import json

import inception

#tf.config.gpu.set_per_process_memory_growth(True)
gpus = tf.config.experimental.list_physical_devices('GPU')
for gpu in gpus:
  tf.config.experimental.set_memory_growth(gpu, True)

#inception.maybe_download()

model = inception.Inception()

PORT = 9600

#image_size = 384
image_size = 160

def classify(image_path, www):
    # Display the image.
    #display(Image(image_path))

    # Use the Inception model to classify the image.
    pred = model.classify(image_path=image_path)

    # Print the scores and names for the top-10 predictions.
    ret = model.print_scores(pred=pred, k=10, only_first_name=True)
    ret = json.dumps(str(ret))
    print(ret)

    #ret = pred
    www.send_response(200)
    www.send_header("Content-type", "text/txt")
    www.end_headers()

    www.wfile.write(ret.encode()) #.encode()

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        qs = {}
        url = self.path

        if (url != "/favicon.ico"):

            parsed_url = urlparse(url)
            qs = parse_qs(parsed_url.query)
            #img = qs["img"]
            #img = img[0]
            img = url.replace("/?img=","").replace("thumb.","").replace("http://192.168.0.32/images/mscoco/tn/","")
            print(img)

            #sys.argv[1]
            image = "/var/www/html/images/mscoco/" + img

            classify(image, self)

        return 0 #http.server.SimpleHTTPRequestHandler.do_GET(self) #self

Handler = MyHttpRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Http Server Serving at port", PORT)
    httpd.serve_forever()
