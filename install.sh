#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' 

CHECK_MARK='✅'
WARNING='⚠️'
ROCKET='🚀'

echo -e "${YELLOW}Cloning repo...${NC}"
git clone https://github.com/2ri4eUI/CFW-BOT.git

cd CFW-BOT

echo -e "${YELLOW}Installing requirements...${NC}"

if [ -f "dos2unix.py" ]; then
    python3 dos2unix.py
    echo -e "${GREEN}${CHECK_MARK} dos2unix.py executed${NC}"
fi

if [ -f "requirement.sh" ]; then

    python3 dos2unix.py requirement.sh
    echo -e "${GREEN}${CHECK_MARK} requirement.sh converted to UNIX format${NC}"
    

    echo -e "${YELLOW}Installing requirements: ${NC}\c"
    for i in {1..10}; do
        echo -e -n "${GREEN}.${NC}"
        sleep 1  
    done
    echo -e " ${GREEN}${CHECK_MARK}${NC}"
fi

echo -e "${YELLOW}Now you can start adding your API tokens...${NC}"

python3 install.py

echo -e "${GREEN}${ROCKET} Installation complete${NC}"
echo -e "${GREEN}${ROCKET} Starting bot...${NC}"

python3 cfw.py
