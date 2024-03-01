# CFW-BOT
Cloudflare Woker Bot ! No servers needed, just pure Xray link creation, all running smoothly on PythonAnywhere. a Shortcut to internet freedom! ✨"
![1](https://github.com/2ri4eUI/CFW-BOT/assets/139592104/a2ff80e6-3c33-4443-9ee5-85b445e4a9f6)

## Table of Contents
- [What is this ?](#what-is-this-)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [LAZY INSTALL](#lazy-install)
  - [ADVANCE INSTALL](#advanced-install)
  - [How To Use the Bot](#how-to-use-the-bot)
- [Note](#note)
- [Disclaimer](#disclaimer)

# What is this ?
This Python Telegram bot, powered by Cloudflare's Workers, makes generating Xray links a breeze! No need for complex server setups, just follow these simple steps to get started:
## Features
- **Easy Setup**: No server configurations required. With Cloudflare's Workers, deploying the bot is a breeze.
- **Persistent Storage**: Utilizes SQLite for database management, ensuring that your user data and generated links are securely stored.
- **User Management**: Create and manage multiple users with ease. Each user has access to their generated links at all times.
- **Efficient Deployment**: Leveraging Wrangler, the bot's worker script can be easily deployed on Cloudflare, ensuring reliability and scalability.

## Prerequisites
- One domain registered on Cloudflare
- Access to Cloudflare account
- Telegram Bot token (available from Telegram's BotFather)
- Cloudflare API key (generate one from Cloudflare dashboard)
- Account ID of your Cloudflare account
- User ID of the Telegram account you want to use the bot on (for authentication)

## LAZY INSTALL
1. Register for a free account on [PythonAnywhere](https://www.pythonanywhere.com).
2. Obtain the required API keys:
   - Telegram Bot token from BotFather
   - Cloudflare API key from Cloudflare dashboard (make sure to select "Edit Cloudflare Workers template" and grant necessary permissions, all of them should have EDIT permission)
   - Telegram UserID you can obtain it from here https://t.me/useridinfobot or any similar bot you know
   - Cloudflare Account id, you can find it from right side of overview page or worker page in cloudflare
4. in your Dashboard section Select Files and and Click on "Open Bash Console Here"
5.  Clone this repository:
   ```bash
   git clone https://github.com/2ri4eUI/CFW-BOT.git
  ```
6. Navigate to the project directory:

   ```bash
   cd CFW-BOT
   ```
7. Make `requirement.sh` executable:
   ```bash
   chmod +x requirement.sh
   ```

8. Run `requirement.sh`:
   ```bash
   ./requirement.sh
   ```
"If you encounter errors running requirement.sh on PythonAnywhere right after creating your account, simply close the console, wait for 15 minutes, then reopen the console and try running requirement.sh again. If the issue persists, try editing the script using nano requirement.sh, exit without making any changes, and rerun the script."

10. Run `install.py` and provide the required API tokens when prompted:
   ```bash
   python3 install.py
   ```
11. Start the bot:
   ```bash
   python3 cfw.py
   ```
## ADVANCED INSTALL

1. install requirements:
   ```bash
   pip install telebot
   pip install pytelegrambotapi --upgrade
   pip install qrcode[pil]
   pip install requests
   pip install python-dotenv
   ```
2. install NVM
  ```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```
3. set nvm settings
  ``` bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads NVM
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads NVM bash completion
```
4. start nvm and install wrangler
  ```bash
nvm use 16.17.0
npm install wrangler@latest
npx wrangler --version
```
5. set .env file variables


| Variable             | Description                                            |
|----------------------|--------------------------------------------------------|
| CLOUDFLARE_API_TOKEN | Cloudflare API token with Worker edit permission       |
| BOT_TOKEN            | Telegram bot token obtained from BotFather             |
| ACCOUNT_ID           | Cloudflare account ID                                  |
| ADMIN_USER_ID        | Numeric Telegram user ID for admin authentication      |

6.remember to set cloudflare account id in workertemp.txt 


## How To Use the Bot
Once the bot is running, simply send the necessary commands to generate Xray links right from your Telegram app!
Creating a new user is a straightforward process. Follow these steps to get started:
**Obtain Cloudflare IP or Domain:**
   - Use platforms like [fofa.info](https://fofa.info) to find Cloudflare IP addresses or domains.
   - Example search query for fofa.info:
     ```bash
     
     server=="cloudflare" && port=="443" && country=="NL" && city=="Amsterdam"
     ```
   - Choose based on your preferences and network speed.

## Note
This bot is designed to be lightweight and inexpensive to run, making it accessible for everyone. Enjoy creating Xray links hassle-free!


## Disclaimer

I want to acknowledge the work of others and clarify that the `index.js` file is not my original work. It has been edited solely to ensure compatibility with the bot. 

This project is just the beginning, and there is potential for it to evolve further. The extent to which it progresses depends on how much it is liked and used. Your feedback and contributions are appreciated!

