#!/bin/bash

git clone https://github.com/2ri4eUI/CFW-BOT.git

cd CFW-BOT

chmod +x requirement.sh

./requirement.sh

python3 dos2unix.py

python3 install.py

python3 cfw.py

echo "Installation  complete"
