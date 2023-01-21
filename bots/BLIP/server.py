import http.server
import json
import requests
import torch

from urllib.parse import urlparse, parse_qs

from PIL import Image
from torchvision import transforms
from torchvision.transforms.functional import InterpolationMode
from models.blip import blip_decoder

import sys

import socketserver # Establish the TCP Socket connections

PORT = 9000
#image_size = 384
image_size = 160

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

#model_url = 'https://storage.googleapis.com/sfr-vision-language-research/BLIP/models/model_base_capfilt_large.pth'

model_url = '/home/sd/window-to-the-world/bots/BLIP.prod/model_base_14M.pth'
model_url = '/home/sd/window-to-the-world/bots/BLIP.prod/model_large.pth'
model_url = '/home/sd/window-to-the-world/bots/BLIP.prod/model_base_capfilt_large.pth'
model_url = '/home/sd/window-to-the-world/bots/BLIP.prod/model_base.pth'

model = blip_decoder(pretrained=model_url, image_size=image_size, vit='base')
model.eval()
model = model.to(device)

def load_demo_image(image_file,image_size,device):
    raw_image = Image.open(requests.get(image_file, stream=True).raw).convert('RGB')
    #raw_image = Image.open(open(img_file, "rb")).convert('RGB')

    w,h = raw_image.size

    transform = transforms.Compose([
        transforms.Resize((image_size,image_size),interpolation=InterpolationMode.BICUBIC),
        transforms.ToTensor(),
        transforms.Normalize((0.48145466, 0.4578275, 0.40821073), (0.26862954, 0.26130258, 0.27577711))
        ])
    image = transform(raw_image).unsqueeze(0).to(device)
    return image


class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        qs = {}
        url = self.path
        parsed_url = urlparse(url)
        qs = parse_qs(parsed_url.query)
        img = qs["img"]
        img = img[0]

        #print(img)

        #sys.argv[1]
        image = load_demo_image(img,image_size=image_size, device=device)

        with torch.no_grad():
            # beam search
            caption = model.generate(image, sample=False, num_beams=4, max_length=20, min_length=5)
            # nucleus sampling
            #caption = model.generate(image, sample=True, top_p=0.9, max_length=20, min_length=5)

            print('caption: '+caption[0])

            self.send_response(200)
            self.send_header("Content-type", "text/txt")
            self.end_headers()

            capt = '{ "caption": "' + caption[0] + '"}'
            capt_json = json.loads(capt)
            capt_text = capt

            #c = "{ caption: " + "'" + caption[0] + "'}"
            self.wfile.write(capt_text.encode()) #.encode()

        return 0 #http.server.SimpleHTTPRequestHandler.do_GET(self) #self

Handler = MyHttpRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Http Server Serving at port", PORT)
    httpd.serve_forever()
