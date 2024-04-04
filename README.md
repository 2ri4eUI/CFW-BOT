[![Lang_farsi](https://user-images.githubusercontent.com/125398461/234186932-52f1fa82-52c6-417f-8b37-08fe9250a55f.png) فارسی](README-FA.md) 
[ENGLISH](README.md)

# CFW-BOT V0.04
Cloudflare Woker Bot ! No servers needed, just pure Xray link creation, all running smoothly on PythonAnywhere. a Shortcut to internet freedom! ✨"

![image](https://github.com/2ri4eUI/CFW-BOT/assets/139592104/8db90fe5-dd6e-4015-840e-5df58ff5f12e)

![image](https://github.com/2ri4eUI/CFW-BOT/assets/139592104/2512c617-b93a-48ac-a6a9-58bdd5fb67c6)

# version 0.02 | What is new ?
- it can create unique subscription worker link for each user that can use IP-API value
- subscription can be updated just by changing the IP_API value
- cloudflare webiste error solved

# version 0.03 | What is NEW?
- added proxies.txt , now you can create your favorite proxy list in bot
- access to your favorite proxy while adding new user or changing users proxies
- access to recently used proxies
- redeploy your worker script with new proxy that you set
- you can change all users proxies at once !
- no tls configurate added
- bug fixed : now delete subscripton worker when you delete a user

# version 0.04 |what is NEW?
- added SingBox Subscription Link
- added Cloudflare page redirect
- added Wiki - every thing you need to know about the bot !
- added button that show current subdomain of worker and button to change that in cloudflare
- added CF Proxy button, which show content of Proxies.txt as button when creating a user or changing user proxy
- added redeploy option for users, which can upload your worker with new proxy.
- minor bug fix
  
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
## Single Command install | BETA 
i will release the final version soon!
just copy and run and send tokens when it ask for them :

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/NiREvil/CFW-BOT/main/install.sh)"
```
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
 git clone https://github.com/NiREvil/CFW-BOT.git
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
"If you encounter errors running requirement.sh on PythonAnywhere , simply close the console (using `exit` command) , go to file manager and open it and  save it (use `ctrl+s` ) without changing any thing. thats it! now you can run it"
another solution is converting it using dos2unix 
since PythonAnyWhere does not support that you can use this simple python code 'dos2unix.py'
you can run this to solve the issue:
 ```bash
 python3 dos2unix.py
 ```
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
nvm install 16.17.0
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
| IP_API               | use this as refrence https://raw.githubusercontent.com/2ri4eUI/CFW_Worker_Sub/main/ips.txt|

6.remember to set cloudflare account id in workertemp.txt 


## How To Use the Bot
At this stage, you have two options for entering the IP address in the CFW-BOT:

1- Using a Cloudflare clean IP: This type of IP will make you have good download speed and ping, but sites that use Cloudflare's CDN will not load for you. The method of finding a clean IP is explained here. [link to article](https://github.com/NiREvil/CFW-BOT/blob/main/CFW_Worker_Sub.md)

2- Using a proxyIP: This type of IP may have about ten percent lower speed compared to Cloudflare IP's, and it may be filtered after one or two months, forcing you to change it. However, the advantage is that all sites, even those behind Cloudflare, open easily and without problems. I have written here an easy and fast way to find proxyIP. [link to article](https://github.com/NiREvil/vless/blob/main/sub/ProxyIP.md)


## Note
This bot is designed to be lightweight and inexpensive to run, making it accessible for everyone. Enjoy creating Xray links hassle-free!


## Disclaimer

I want to acknowledge the work of others and clarify that the `index.js` and `subworker.js` file is not my original work. It has been edited solely to ensure compatibility with the bot. 

## HUGE THANKS TO 
https://github.com/cmliu for creating these workers

This project is just the beginning, and there is potential for it to evolve further. The extent to which it progresses depends on how much it is liked and used. Your feedback and contributions are appreciated!

