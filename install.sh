#!/bin/bash
echo "cloning repo"
git clone https://github.com/2ri4eUI/CFW-BOT.git
cd CFW-BOT
echo "installing requirments"
python3 dos2unix.py
chmod +x requirement.sh
./requirement.sh
echo " now you can start adding your api tokens"
python3 install.py
echo "Installation  complete"
echo "STARTING BOT..."
python3 cfw.py

