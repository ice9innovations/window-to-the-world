import sys
import os
import numpy as np
import matplotlib.pyplot as plt
from torchvision import transforms
import torch
from model import EncoderCNN, DecoderRNN
from vocabulary import Vocabulary
from helpers import *

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
root_path = sys.argv[1]
image_path = sys.argv[2]

#root_path = "/root/node-image-caption/"
#image_path = "/root/node-image-caption/public/img/imagedata"

# Define a transform to pre-process the testing images.
transform_test = transforms.Compose([ 
    transforms.Resize(256),                          # smaller edge of image resized to 256
    transforms.RandomCrop(224),                      # get 224x224 crop from random location
    transforms.RandomHorizontalFlip(),               # horizontally flip image with probability=0.5
    transforms.ToTensor(),                           # convert the PIL Image to a tensor
    transforms.Normalize((0.485, 0.456, 0.406),      # normalize image for pre-trained model
                         (0.229, 0.224, 0.225))])

# Specify the saved models to load.
encoder_file = "encoder-3.pkl" 
decoder_file = "decoder-3.pkl"

# Select appropriate values for the Python variables below.
embed_size = 256
hidden_size = 512

# The size of the vocabulary.
#vocab_size = len(data_loader.dataset.vocab)
vocab = Vocabulary(vocab_threshold=None,vocab_file=root_path + '/Python_NN/vocab.pkl',annotations_file=root_path +'/Python_NN/captions_train2014.json',vocab_from_file=True)
vocab_size = len(vocab)

# Initialize the encoder and decoder, and set each to inference mode.
encoder = EncoderCNN(embed_size)
encoder.eval()
decoder = DecoderRNN(embed_size, hidden_size, vocab_size)
decoder.eval()

# Load the trained weights.
encoder.load_state_dict(torch.load(os.path.join(root_path + '/Python_NN/models', encoder_file), map_location='cpu'))
decoder.load_state_dict(torch.load(os.path.join(root_path + '/Python_NN/models', decoder_file), map_location='cpu'))

# Move models to GPU if CUDA is available.
encoder.to(device)
decoder.to(device)

###########################################################

orig_image, image = get_image(transform_test, image_path)
image = image.to(device)
image = image.unsqueeze(0)

features = encoder(image).unsqueeze(1)
output = decoder.sample(features)    
sentence = clean_sentence(output, vocab)
print(sentence)
sys.stdout.flush()
