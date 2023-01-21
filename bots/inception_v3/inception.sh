#!/bin/bash

eval "$(conda shell.bash hook)"
conda activate inception

python3 server.py
