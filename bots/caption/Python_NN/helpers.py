from PIL import Image
import numpy as np

def clean_sentence(output, vocab):
    sentence = ""
    for i in output:
        if i > 1:
            word = vocab.idx2word[i]
            if sentence != "":
                if i != 18:
                    sentence += " " + word
                else:
                    sentence += word
                    break
            else:
                sentence = word
    return sentence

def get_image(transform, path):
    # Convert image to tensor and pre-process using transform
    PIL_image = Image.open(open(path, 'rb')).convert('RGB')
    orig_image = np.array(PIL_image)
    image = transform(PIL_image)
    
    # return original image and pre-processed image tensor
    return orig_image, image
