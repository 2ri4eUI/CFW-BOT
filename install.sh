#!/bin/bash

echo "Cloning repo..."
git clone https://github.com/2ri4eUI/CFW-BOT.git


cd CFW-BOT

echo "Installing requirements..."


if [ -f "dos2unix.py" ]; then
    python3 dos2unix.py
    echo "dos2unix.py executed"
fi

if [ -f "requirement.sh" ]; then

    python3 dos2unix.py requirement.sh
    echo "requirement.sh converted to UNIX format"
    
    chmod +x requirement.sh
    ./requirement.sh
    echo "requirement.sh executed"
fi

clear
echo "Now you can start adding your API tokens..."

python3 install.py

echo "Installation complete"
echo "Starting bot..."

python3 cfw.py
