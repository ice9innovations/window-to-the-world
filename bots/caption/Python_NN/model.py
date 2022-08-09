import torch
import torch.nn as nn
import torchvision.models as models
from torch.autograd import Variable

class EncoderCNN(nn.Module):
    def __init__(self, embed_size):
        super(EncoderCNN, self).__init__()
        resnet = models.resnet50(pretrained=True)
        for param in resnet.parameters():
#             param.requires_grad_(False)
            param.requires_grad = False
            
        modules = list(resnet.children())[:-1]
        self.resnet = nn.Sequential(*modules)
        self.embed = nn.Linear(resnet.fc.in_features, embed_size)
        self.batch_norm = nn.BatchNorm1d(embed_size, momentum=0.01)

    def forward(self, images):
        features = self.resnet(images)
        features = features.view(features.size(0), -1)
        features = self.batch_norm(self.embed(features))
        return features
    

class DecoderRNN(nn.Module):
    def __init__(self, embed_size, hidden_size, vocab_size, num_layers=1):
        super(DecoderRNN, self).__init__()
        self.hidden_size = hidden_size
        self.embeddings = nn.Embedding(vocab_size, embed_size)
        self.lstm = nn.LSTM(embed_size, hidden_size, num_layers, batch_first=True)
        self.linear = nn.Linear(hidden_size, vocab_size)
        
    
    
    def forward(self, features, captions):
        embeds = self.embeddings(captions)
        embeds = torch.cat((features.unsqueeze(1), embeds), 1)
        lengths = [len(cap) for cap in captions]
        packed = nn.utils.rnn.pack_padded_sequence(embeds, lengths, batch_first=True)
        lstm_out, _ = self.lstm(packed)
        unpacked = nn.utils.rnn.pad_packed_sequence(lstm_out, batch_first=True)
        outputs = self.linear(unpacked[0])
        return outputs


    def sample(self, inputs, states=None, max_len=20):
        " accepts pre-processed image tensor (inputs) and returns predicted sentence (list of tensor ids of length max_len) "
        sampled_ids = []
        for i in range(max_len):
            hiddens, states = self.lstm(inputs, states)          
            outputs = self.linear(hiddens.squeeze(1))            
            _, predicted = outputs.max(1)                        
            sampled_ids.append(predicted)
            inputs = self.embeddings(predicted)                       
            inputs = inputs.unsqueeze(1)                         
        sampled_ids = torch.stack(sampled_ids, 1).numpy().tolist()               
        return sampled_ids[0]
