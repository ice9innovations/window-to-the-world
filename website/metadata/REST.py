from flask import Flask, request

import io
import json
import requests
import os
import sys
import uuid
import subprocess
import sys
import exiftool
import hashlib
import base64

from scipy.stats import entropy
import numpy as np
import cv2
from PIL import Image,ExifTags

from dotenv import load_dotenv

infoDict = {} #Creating the dict to get the metadata tags

#exifToolPath = 'exiftool'

load_dotenv()
FOLDER = './'

def md5hash(img):
    md5hash = hashlib.md5(Image.open(img).tobytes())
    ret = md5hash.hexdigest()

    return ret

def sha1hash(img):
    sha1hash = hashlib.sha1(Image.open(img).tobytes())
    ret = sha1hash.hexdigest()

    return ret

def exifPIL(img):
    pillow = {}

    img = Image.open(img)
    exifdata = img.getexif()
    for tag_id in exifdata:
        tag = exifdata.get(tag_id,tag_id)
        print(tag_id)
        data = exifdata.get(tag_id)
        # we decode bytes
        if isinstance(data,bytes):
            data = data.decode()
        #print(f'{tag:25}: {data}')
        pillow[tag] = data
    #print(pillow)
    return pillow

def exif(img):
    with exiftool.ExifTool() as et:
        metadata = et.get_metadata(img)

    sz = metadata["Composite:ImageSize"]
    sza = sz.split(" ")
    try:
        height = metadata["File:ImageHeight"]
        width = metadata["File:ImageWidth"]
    except:
        # fallback
        width = float(sza[0])
        height = float(sza[1])

    print(width)
    print(height)

    if width == height:
        square = True
    else:
        square = False

    metadata["aspect"] = float(height) / float(width)
    metadata["square"] = square
    metadata["entropy"] = calc_entropy(img)
    metadata["md5"] = md5hash(img)
    metadata["sha1"] = sha1hash(img)

    #pillow_meta = exifPIL(img)
    #print(pillow_meta)

    #try:
    #for key, val in pillow_meta:
        #print(key)
        #print(val)
    #    metadata[key + "_pillow"] = val
    #except:
    #    pass

    os.remove(img)

    return metadata


def calc_entropy(img):
    image = cv2.imread(img)
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    _bins = 128

    hist, _ = np.histogram(gray_image.ravel(), bins=_bins, range=(0, _bins))
    prob_dist = hist / hist.sum()
    image_entropy = entropy(prob_dist, base=2).round(4)
    #print(f"Image Entropy {image_entropy}")

    return image_entropy

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():

    if request.method == 'GET':
        url = request.args.get('url')
        path = request.args.get('path')

        if url:
            print (url)
            fn = uuid.uuid4().hex + ".jpg"

            response = requests.get(url)
            with open(fn, mode="wb") as file:
                file.write(response.content)

            exif_data = exif(fn)
            print(exif_data)

            return exif_data
        elif path:
            exif_data = exif(path)
            print(exif_data)

            return exif_data
        else:
            #default, basic HTML

            html = ""
            try:
                with open('form.html', 'r') as file:
                    html = file.read()
            except:
                html = '''<form enctype="multipart/form-data" action="" method="POST">
                    <input type="hidden" name="MAX_FILE_SIZE" value="8000000" />
                    <input name="uploadedfile" type="file" /><br />
                    <input type="submit" value="Upload File" />
                </form>'''

            return html

    if request.method == 'POST':
        exif_data = ""
        for field, data in request.files.items():
            fn = uuid.uuid4().hex + ".jpg"
            print('field:', field)
            print('filename:', data.filename)
            print('UUID:', fn)
            data.save(os.path.join(FOLDER, fn)) #data.filename

            if data.filename:
                exif_data = exif(fn)
                print(exif_data)

        #return "OK"
        return exif_data

if __name__ == '__main__':
    # Debug/Development
    IP = "0.0.0.0"
    IP = "127.0.0.1"
    app.run(use_reloader=False,debug=True, host="0.0.0.0", port=7777)

