import telebot
import os
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
import subprocess
import uuid
import time
import sqlite3
import requests
import qrcode
from telebot import types
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()
ip_api = os.getenv('IP_API')
bot_token = os.getenv('BOT_TOKEN')
account_id = os.getenv('ACCOUNT_ID')
api_token = os.getenv('CLOUDFLARE_API_TOKEN')
admin_user_id = os.getenv('ADMIN_USER_ID')
bot = telebot.TeleBot(bot_token)
user_states = {}
users_directory = 'users'
index_js_path = 'index.js'
subs_js_path = 'subworker.js'
db_path = 'cfw.db'
proxy_message_id = None
proxy_state = False
INPUT_NEW_API = 0

@bot.message_handler(commands=['start'])
def authorize(message):

    if str(message.from_user.id) == str(admin_user_id):
        print(f"Admin User ID: {admin_user_id}")
        print(f"User ID: {message.from_user.id}")

        send_welcome(message)
    else:
        unauthorized_message = "❌ Unauthorized access! You do not have permission to use this command."
        bot.send_message(message.chat.id, unauthorized_message)


def send_welcome(message):

    menu_markup = InlineKeyboardMarkup()
    add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
    user_panel_button = InlineKeyboardButton("🔰 Users Panel", callback_data="user_panel")
    subscriptions_button = InlineKeyboardButton("📋 Subscriptions ips", callback_data="subscriptions") 
    proxy_txt_button = InlineKeyboardButton("📁CF Proxies", callback_data="proxy_list")
    menu_markup.add(add_user_button, user_panel_button)  
    menu_markup.add(subscriptions_button)
    menu_markup.add(proxy_txt_button)
    welcome_message = "Welcome to C-F-W Bot (v0.03)!\n ✌️ RISE AND FIGHT FOR FREEDOM ✌️ !\n "
    
    bot.send_message(message.chat.id, welcome_message, reply_markup=menu_markup)

@bot.callback_query_handler(func=lambda call: call.data == 'proxy_list')
def proxylist(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    filename = 'proxies.txt'
    if os.path.isfile(filename):
        with open(filename, 'r') as file:
            proxies_content = file.read()
        bot.send_message(call.message.chat.id, f"📁| Current proxies:\n<code>{proxies_content}</code>", parse_mode="HTML")
    else:
        bot.send_message(call.message.chat.id, "No proxies found in proxies.txt.")
    
    bot.send_message(call.message.chat.id, "Please send NEW list of favorite proxies, each on a separate line.\n\n you can use them for creating user or changing proxies")
    bot.register_next_step_handler(call.message, handle_proxies_input)

def handle_proxies_input(message):
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return
    if message.text:
        proxies = message.text.strip().split('\n')
        if proxies:
            filename = 'proxies.txt'
            with open(filename, 'w') as file:
                for proxy in proxies:
                    file.write(proxy.strip() + '\n')
            bot.send_message(message.chat.id, "✅Proxies saved successfully.✅")
            send_welcome(message)
        else:
            bot.send_message(message.chat.id, "No proxies provided. Please send at least one proxy.")
            send_welcome(message)
    else:
        bot.send_message(message.chat.id, "Invalid input. Please send the list of proxies as text.")
        send_welcome(message)

@bot.callback_query_handler(func=lambda call: call.data == 'subscriptions')
def subscriptions(call):
    load_dotenv()
    ip_api = os.getenv('IP_API')
    bot.delete_message(call.message.chat.id, call.message.message_id)
    message_text = f"The value of IP_API is: {ip_api}"

    keyboard = [
        [InlineKeyboardButton("Change", callback_data="change_ip_api"),
         InlineKeyboardButton("Keep", callback_data="keep_ip_api")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    bot.send_message(call.message.chat.id, message_text, reply_markup=reply_markup)

@bot.callback_query_handler(func=lambda call: call.data == 'change_ip_api')
def subscriptions(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    user_states[call.from_user.id] = 'waiting_for_api'
    message_text = "Please provide the new value for IP_API."

    bot.send_message(call.message.chat.id, message_text)

@bot.callback_query_handler(func=lambda call: call.data == 'keep_ip_api')
def keep_ip_api(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    send_welcome(call.message)
    
@bot.message_handler(func=lambda message: user_states.get(message.from_user.id) == 'waiting_for_api')
def handle_new_api_value(message):
    new_api_value = message.text.strip()

    env_lines = []
    with open('.env', 'r') as env_file:
        env_lines = env_file.readlines()

    env_lines = [line for line in env_lines if not line.startswith('IP_API=')]

    env_lines.append(f"IP_API='{new_api_value}'\n")

    with open('.env', 'w') as env_file:
        env_file.writelines(env_lines)

    os.environ['IP_API'] = new_api_value

    user_states[message.from_user.id] = None
    bot.send_message(message.chat.id, f"IP_API has been updated to: '{new_api_value}'")
    send_welcome(message)

@bot.callback_query_handler(func=lambda call: call.data == 'return')
def return_to_start(call):

    send_welcome(call.message)
    bot.delete_message(call.message.chat.id, call.message.message_id)

    
@bot.callback_query_handler(func=lambda call: call.data.startswith('user_panel'))
def user_panel_cfw(call):
    global proxy_state 
    proxy_state = False
    bot.delete_message(call.message.chat.id, call.message.message_id)
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    cursor.execute('SELECT name FROM user')
    rows = cursor.fetchall()

    keyboard = InlineKeyboardMarkup()
    
    for row in rows:
        name = row[0]
        callback_data = f"user:{name}"  
        button = InlineKeyboardButton("👤|" + name, callback_data=callback_data)
        keyboard.add(button)

    change_all_button = InlineKeyboardButton("🆕 Proxy for USERS", callback_data="change_all_proxies")
    keyboard.add(change_all_button)

    return_button = InlineKeyboardButton("🔙 Return", callback_data="return")
    keyboard.add(return_button)
    
    connection.close()

    bot.send_message(call.message.chat.id, "Select a user:", reply_markup=keyboard)

@bot.callback_query_handler(func=lambda call: call.data.startswith('user:'))
def user_info_callback(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    user_name = call.data.split(':')[1]

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM user WHERE name = ?', (user_name,))
    row = cursor.fetchone()

    if row and None in row:
        cursor.execute('DELETE FROM user WHERE name = ?', (user_name,))
        connection.commit()
        keyboard = InlineKeyboardMarkup()
        return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
        keyboard.add(return_button)
        bot.send_message(call.message.chat.id, f"❌ ℹ️ Deleted '{user_name}', its was not valid❌", reply_markup=keyboard)
        connection.close()
        return

    connection.close()

    if row:
        uuid, subdomain, ip = row[1], row[2], row[3]

        vless_link = create_vless_config(subdomain, uuid, user_name)
        nontls_config = create_nontls_config(subdomain, uuid, user_name)
        sub_link = f"https://sub{subdomain}/{user_name}"
        message_text = f"<b>🔰USER INFO🔰</b>\n\n"
        message_text += f"👤 <b>Name:</b> {user_name}\n"
        message_text += f"🔑 <b>UUID:</b> {uuid}\n"
        message_text += f"🌐 <b>IP:</b> {ip}\n"
        message_text += f"📡 <b>Subdomain:</b> {subdomain}\n\n"
        message_text += f"🔗tls: <code>{vless_link}</code>\n\n"
        message_text += f"🔗notls: <code>{nontls_config}</code>\n\n"
        message_text += f"📋: <code>{sub_link}</code>"

        keyboard = InlineKeyboardMarkup()
        delete_button = InlineKeyboardButton("🗑️ Delete", callback_data=f"delete:{user_name}")
        qr_button = InlineKeyboardButton("🔲 QR", callback_data=f"qr:{user_name}")
        redeploy_button = InlineKeyboardButton("🔄 Redeploy", callback_data=f"redeploy:{user_name}")
        change_proxy_button = InlineKeyboardButton("🆕 New Proxy", callback_data=f"newproxy:{user_name}")
        return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
        keyboard.add(delete_button, qr_button)
        keyboard.add(change_proxy_button, redeploy_button)
        keyboard.add(return_button)

        bot.send_message(call.message.chat.id, message_text, reply_markup=keyboard, parse_mode="HTML")
    else:
        bot.send_message(call.message.chat.id, "❌ User not found.❌")


def delete_worker(account_id, api_token, worker_name):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{worker_name}"

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }

    response = requests.delete(url, headers=headers)

    if response.status_code == 200:
        print(f"Worker '{worker_name}' deleted successfully from Cloudflare.")
    else:
        print(f"Error: Failed to delete worker '{worker_name}' (Status code: {response.status_code})")

def delete_sub_worker(account_id, api_token, worker_name):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/subworker{worker_name}"

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }

    response = requests.delete(url, headers=headers)

    if response.status_code == 200:
        print(f"Worker 'subworker{worker_name}' deleted successfully from Cloudflare.")
    else:
        print(f"Error: Failed to delete worker 'subworker{worker_name}' (Status code: {response.status_code})")



@bot.callback_query_handler(func=lambda call: call.data.startswith('change_all_proxies'))
def change_all_user_proxies(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    global proxy_message_id 
    global proxy_state
    proxy_state = True 
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('SELECT name FROM user')
    users = cursor.fetchall()
    cursor.execute('SELECT DISTINCT ip FROM user WHERE ip IS NOT NULL')
    ips = [ip[0] for ip in cursor.fetchall()]

    proxies = []
    if os.path.isfile('proxies.txt'):
        with open('proxies.txt', 'r') as file:
            proxies = file.read().splitlines()

    options = ips + proxies

    keyboard = InlineKeyboardMarkup()
    for option in options:
        keyboard.add(InlineKeyboardButton(option, callback_data=f"newproxy_for_all:{option}"))
    return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
    keyboard.add(return_button)
    connection.close()

    if options:
        proxy_message = bot.send_message(call.message.chat.id, "Please select the new proxy IP from the list or enter a new one:", reply_markup=keyboard)
        proxy_message_id = proxy_message.message_id
        bot.register_next_step_handler(call.message, update_all_proxies, users, proxy_message_id)
    else:
        bot.send_message(call.message.chat.id, "No proxy options available.")


def update_all_proxies(message, users, proxy_message_id):
    global proxy_state
    if proxy_state:
        try:
            if proxy_message_id:
                bot.delete_message(message.chat.id, proxy_message_id)
        except Exception as e:
            print("Error deleting message:", e)

        new_proxy_ip = message.text
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()

        try:
            with connection:
                for user in users:
                    user_name = user[0]
                    cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (new_proxy_ip, user_name))

                message_text = f"✅ Proxy IPs updated successfully for ALL USERS!✅\n\n new proxy is ➡️ {new_proxy_ip}"
                keyboard = InlineKeyboardMarkup()
                return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
                keyboard.add(return_button)
                bot.send_message(message.chat.id, message_text, reply_markup=keyboard, parse_mode="HTML")
        except Exception as e:
            error_message_txt = "❌ Failed to update proxy IPs. Please try again later. ❌"
            keyboard = InlineKeyboardMarkup()
            return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
            keyboard.add(return_button)
            bot.send_message(message.chat.id, error_message_txt, reply_markup=keyboard, parse_mode="HTML")
        finally:
            connection.close()
            proxy_state = False


@bot.callback_query_handler(func=lambda call: call.data.startswith('newproxy_for_all:'))
def change_proxy_for_all(call):
    global proxy_message_id 
    global proxy_state
    bot.delete_message(call.message.chat.id, call.message.message_id)
    new_proxy_ip = call.data.split(':')[1] 

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    try:
        with connection:
            cursor.execute('SELECT name FROM user')
            users = cursor.fetchall()

            for user in users:
                user_name = user[0]
                cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (new_proxy_ip, user_name))

            message_text = f"✅ Proxy IPs updated successfully for ALL USERS!✅ \n\n new Proxy is ➡️ {new_proxy_ip}"
            keyboard = InlineKeyboardMarkup()
            return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
            keyboard.add(return_button)
            bot.send_message(call.message.chat.id, message_text, reply_markup=keyboard, parse_mode="HTML")
    except Exception as e:
        error_message_txt = "❌ Failed to update proxy IPs. Please try again please. ❌"
        keyboard = InlineKeyboardMarkup()
        return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
        keyboard.add(return_button)
        bot.send_message(call.message.chat.id, error_message_txt, reply_markup=keyboard, parse_mode="HTML")
    finally:
        connection.close()
        proxy_state = False

@bot.callback_query_handler(func=lambda call: call.data.startswith('newproxy:'))
def change_user_proxy(call):
    global proxy_message_id 
    global proxy_state
    proxy_state = True

    bot.delete_message(call.message.chat.id, call.message.message_id)
    user_name = call.data.split(':')[1]
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM user WHERE name = ?', (user_name,))
    row = cursor.fetchone()

    if row:
        proxyip_from_db = row[3]

        cursor.execute('SELECT DISTINCT ip FROM user WHERE ip IS NOT NULL')
        ips = [ip[0] for ip in cursor.fetchall()]
        
        proxies = []
        if os.path.isfile('proxies.txt'):
            with open('proxies.txt', 'r') as file:
                proxies = file.read().splitlines()

        options = ips + proxies

        keyboard = InlineKeyboardMarkup()
        for option in options:
            keyboard.add(InlineKeyboardButton(option, callback_data=f"newproxy_for_user:{option}:{user_name}"))

        return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
        keyboard.add(return_button)

        proxy_message = bot.send_message(call.message.chat.id, f"Current proxy for 👤 {user_name} is ➡️ {proxyip_from_db}\n\n Please select the new proxy IP from the list or send a new one:", reply_markup=keyboard)
        proxy_message_id = proxy_message.message_id
        bot.register_next_step_handler(call.message, update_proxy_ip, user_name, connection, proxy_message_id)

    else:
        bot.send_message(call.message.chat.id, f"User '{user_name}' not found in the database.")
        connection.close()
        proxy_state = False

def update_proxy_ip(message, user_name, connection, proxy_message_id):
    global proxy_state
    if proxy_state:
        try:
            if proxy_message_id:
                bot.delete_message(message.chat.id, proxy_message_id)
        except Exception as e:
            print("Error deleting message:", e)

        new_proxy_ip = message.text
        try:
            with connection:
                cursor = connection.cursor()
                cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (new_proxy_ip, user_name))
                message_text = f"✅Proxy IP updated successfully for 👤{user_name}!✅\n\n new proxy ip is ➡️ {new_proxy_ip}"
                
                keyboard = InlineKeyboardMarkup()
                redeploy_button = InlineKeyboardButton("🔄 Redeploy", callback_data=f"redeploy:{user_name}")
                return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
                keyboard.add(redeploy_button)
                keyboard.add(return_button)

                bot.send_message(message.chat.id, message_text, reply_markup=keyboard, parse_mode="HTML")
        except Exception as e:
            error_message_txt = "❌Failed to update proxy IP. Try Again please ❌"
            keyboard = InlineKeyboardMarkup()
            return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
            keyboard.add(return_button)
            bot.send_message(message.chat.id, error_message_txt, reply_markup=keyboard, parse_mode="HTML") 
        finally:
            connection.close()
            proxy_state = False

@bot.callback_query_handler(func=lambda call: call.data.startswith('newproxy_for_user:'))
def select_new_proxy(call):
    global proxy_state
    bot.delete_message(call.message.chat.id, call.message.message_id)
    data_parts = call.data.split(':')
    new_proxy_ip = data_parts[1]
    user_name = data_parts[2]

    connection = sqlite3.connect(db_path)
    try:
        with connection:
            cursor = connection.cursor()
            cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (new_proxy_ip, user_name))
            message_text = f"✅Proxy IP updated successfully for 👤{user_name}!✅\n\n new proxy ip is ➡️ {new_proxy_ip}"
            
            keyboard = InlineKeyboardMarkup()
            redeploy_button = InlineKeyboardButton("🔄 Redeploy", callback_data=f"redeploy:{user_name}")
            return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
            keyboard.add(redeploy_button)
            keyboard.add(return_button)

            bot.send_message(call.message.chat.id, message_text, reply_markup=keyboard, parse_mode="HTML")
    except Exception as e:
        error_message_txt = "❌Failed to update proxy IP. Try Again please ❌"
        keyboard = InlineKeyboardMarkup()
        return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
        keyboard.add(return_button)
        bot.send_message(call.message.chat.id, error_message_txt, reply_markup=keyboard, parse_mode="HTML") 
    finally:
        connection.close()
        proxy_state = False
 
@bot.callback_query_handler(func=lambda call: call.data.startswith('qr:'))
def qr_vless(call):

    user_name = call.data.split(':')[1]

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM user WHERE name = ?', (user_name,))
    row = cursor.fetchone()

    connection.close()

    uuid = row[1]
    subdomain = row[2]


    vless_link = create_vless_config(subdomain, uuid, user_name)
    qr_tls = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr_tls.add_data(vless_link)
    qr_tls.make(fit=True)

    qr_tls_img = qr_tls.make_image(fill_color="black", back_color="white")

    img_tls_bytes = BytesIO()
    qr_tls_img.save(img_tls_bytes, format='PNG')
    img_tls_bytes.seek(0)

    bot.send_photo(call.message.chat.id, img_tls_bytes, caption="With TLS \n\n🤳 Scan Me! 🤳")


    nontls_config = create_nontls_config(subdomain, uuid, user_name)
    qr_nontls = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr_nontls.add_data(nontls_config)
    qr_nontls.make(fit=True)

    qr_nontls_img = qr_nontls.make_image(fill_color="black", back_color="white")

    img_nontls_bytes = BytesIO()
    qr_nontls_img.save(img_nontls_bytes, format='PNG')
    img_nontls_bytes.seek(0)

    bot.send_photo(call.message.chat.id, img_nontls_bytes, caption="Without TLS \n\n🤳 Scan Me! 🤳")

    del img_tls_bytes
    del img_nontls_bytes


@bot.callback_query_handler(func=lambda call: call.data.startswith('redeploy:'))
def redeploy_user(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)

    user_name = call.data.split(':')[1]
    bot.send_message(call.message.chat.id, f"🌐Redeployment of {user_name} started🌐")
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    cursor.execute('SELECT * FROM user WHERE name = ?', (user_name,))
    row = cursor.fetchone()

    if row:
        print("User Details:")
        print(f"Name: {row[0]}")
        print(f"UUID: {row[1]}")
        print(f"Subdomain: {row[2]}")
        print(f"IP: {row[3]}")

        user_name_from_db = row[0]
        file_name_with_extension = f"{user_name_from_db}.js"
        uuid_from_db = row[1]
        subdomain_from_db = row [2]
        worker_subdomain = f"sub{subdomain_from_db}"
        proxyip_from_db = row[3]
    else:
        print(f"User details not found in the database.")
        connection.close()
        return

    new_file_path = os.path.join(users_directory, file_name_with_extension)
    create_duplicate_file(index_js_path, new_file_path)
    replace_uuid_in_file(uuid_from_db, new_file_path)
    replace_subworker_host(worker_subdomain, new_file_path)
    replace_proxy_ip_in_file(proxyip_from_db, new_file_path)
    new_txt_file_name = f"{user_name_from_db}.txt"
    new_txt_file_path = os.path.join(users_directory, new_txt_file_name)
    update_wrangler_toml(new_txt_file_path)

    connection.close()
    bot.send_message(call.message.chat.id, f"🌐Uploading your new user using Wrangler...🌐\n ⌛ WAIT ~ 30s-1m ⌛")
    sent_message = bot.send_message(call.message.chat.id, "⌛")
    wait_message_id = sent_message.message_id
    deployment_status = run_nvm_use_and_wrangler_deploy(new_file_path)



    try:    
        if deployment_status:
            bot.delete_message(call.message.chat.id, wait_message_id)
            bot.send_message(call.message.chat.id, "✅✅ Workers Deployment successful!✅✅")
            vless_config = create_vless_config(subdomain_from_db, uuid_from_db, user_name_from_db)
            nontls_config = create_nontls_config(subdomain_from_db, uuid_from_db, user_name_from_db)
            sub_link = f"https://{worker_subdomain}/{user_name_from_db}"
            non_tls_config_html = f"<code>{nontls_config}</code>"
            vless_config_html = f"<code>{vless_config}</code>"
            message_text = f"Config: {vless_config_html}\n\n NoTls: {non_tls_config_html}\n\n Sub link: {sub_link}"
            menu_markup = InlineKeyboardMarkup()
            add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
            user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
            menu_markup.add(add_user_button, user_panel_button)
            bot.send_message(call.message.chat.id, message_text, reply_markup=menu_markup, parse_mode="HTML")
        else:
            raise Exception("Deployment failed")
    except Exception as e:
        bot.delete_message(call.message.chat.id, wait_message_id)
        menu_markup = InlineKeyboardMarkup()
        add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
        user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
        menu_markup.add(add_user_button, user_panel_button)
        bot.send_message(call.message.chat.id, f"❌Deployment failed. Error: {str(e)}❌", reply_markup=menu_markup)

@bot.callback_query_handler(func=lambda call: call.data.startswith('delete:'))
def delete_user(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    user_name = call.data.split(':')[1]

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    delete_worker(account_id, api_token, user_name)
    delete_sub_worker(account_id, api_token, user_name)

    cursor.execute('DELETE FROM user WHERE name = ?', (user_name,))
    connection.commit()

    connection.close()

    menu_markup = InlineKeyboardMarkup()
    add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
    user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
    menu_markup.add(add_user_button, user_panel_button)
    bot.send_message(call.message.chat.id, f"✅ Config and Sub Worker for user '{user_name}' deleted successfully.✅", reply_markup=menu_markup)

@bot.callback_query_handler(func=lambda call: call.data.startswith('add_user'))
def add_user_cfw(call):

    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    cancel_button = types.KeyboardButton("Cancel")
    keyboard.add(cancel_button)
    
    bot.delete_message(call.message.chat.id, call.message.message_id)
    user_states[call.from_user.id] = 'waiting_for_filename'
    
    bot.send_message(call.message.chat.id, "Please enter the name of your new user. ", reply_markup=keyboard)


@bot.message_handler(func=lambda message: user_states.get(message.from_user.id) == 'waiting_for_filename')
def handle_filename(message):
    global proxy_message_id 
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return

    new_file_name = message.text.strip() + ".js"
    new_file_name_without_extension = new_file_name.replace('.js', '')
    new_subfile_name = new_file_name_without_extension + "_sub.js"
    if not os.path.exists(users_directory):
        os.makedirs(users_directory)
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM user WHERE name = ?', (new_file_name_without_extension,))
    existing_user = cursor.fetchone()
    cursor.execute('SELECT DISTINCT ip FROM user WHERE ip IS NOT NULL')
    ips = [ip[0] for ip in cursor.fetchall()]
    connection.close()

    
    if existing_user:
        bot.send_message(message.chat.id, "User already exists with this name. Please enter a different name.")
    else:
        new_file_path = os.path.join(users_directory, new_file_name)
        new_subsfile_path = os.path.join(users_directory, new_subfile_name)
        create_duplicate_file(index_js_path, new_file_path)
        create_duplicate_file(subs_js_path, new_subsfile_path)
        bot.send_message(message.chat.id, f"user '{new_file_name}' created.✅")
        
        user_uuid = generate_uuid()
        replace_uuid_in_file(user_uuid, new_file_path)
        replace_uuid_in_sub_file(user_uuid, new_subsfile_path)
        replace_path_in_subfile(new_file_name_without_extension, new_subsfile_path)
        bot.send_message(message.chat.id, f"uuid of new user ➡️ {user_uuid}")
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()
        cursor.execute('INSERT INTO user (name, uuid) VALUES (?, ?)', (new_file_name_without_extension, user_uuid))
        connection.commit()
        connection.close()
        
        proxies = []
        if os.path.isfile('proxies.txt'):
            with open('proxies.txt', 'r') as file:
                proxies = file.read().splitlines()

        options = ips + proxies

        keyboard = InlineKeyboardMarkup()
        for option in options:
            keyboard.add(InlineKeyboardButton(option, callback_data=f"selected_ip:{option}"))

        if options:
            proxy_message = bot.send_message(message.chat.id, "Please select one of the following options or send a new Cloudflare Ip or Domain:", reply_markup=keyboard)
            proxy_message_id = proxy_message.message_id
        else:
            bot.send_message(message.chat.id, "There are no available options. Please enter a new option.")

        user_states[message.from_user.id] = {'state': 'waiting_for_proxy', 'file_name':  new_file_name, 'uuid': user_uuid}
        return

@bot.message_handler(func=lambda message: user_states.get(message.from_user.id, {}).get('state') == 'waiting_for_proxy')
def handle_proxy(message):
    global proxy_message_id 
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return
    if proxy_message_id:
        try:
            bot.delete_message(message.chat.id, proxy_message_id)
        except Exception as e:
            print("Error deleting message:", e)
    new_proxy_ip = message.text.strip()
    
    new_file_name = user_states[message.from_user.id]['file_name']
    
    new_file_path = os.path.join(users_directory, new_file_name)
    
    replace_proxy_ip_in_file(new_proxy_ip, new_file_path)
    bot.send_message(message.chat.id, f"New proxy setting added ➡️ {new_proxy_ip}")

    new_txt_file_name = new_file_name.replace('.js', '.txt')
    create_duplicate_file('workertemp.txt', os.path.join(users_directory, new_txt_file_name))
    new_txt_subfile_name = new_file_name.replace('.js', '_sub.txt')
    create_duplicate_file('workertemp.txt', os.path.join(users_directory, new_txt_subfile_name))
    bot.send_message(message.chat.id, f"Duplicated 'workertemp.txt' as '{new_txt_file_name}' in 'users' directory.")
    new_file_name_without_extension = new_file_name.replace('.js', '')
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (new_proxy_ip, new_file_name_without_extension))
    connection.commit()
    connection.close()
    user_states[message.from_user.id]['state'] = 'waiting_for_subdomain_or_worker_name'
    bot.send_message(message.chat.id, "Please enter the new subdomain for your worker: \n ℹ️ example: subdomain.yourdomain.com \n\n ℹ️ℹ️ DO NOT enter domain that you DO NOT HAVE !")    

@bot.callback_query_handler(func=lambda call: call.data.startswith('selected_ip:'))
def handle_selected_ip(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    selected_ip = call.data.split(':')[1]  
    new_file_name = user_states[call.from_user.id]['file_name']
    new_file_path = os.path.join(users_directory, new_file_name)
    replace_proxy_ip_in_file(selected_ip, new_file_path)
    bot.send_message(call.message.chat.id, f"Selected proxy setting added ➡️ {selected_ip}")

    new_txt_file_name = new_file_name.replace('.js', '.txt')
    create_duplicate_file('workertemp.txt', os.path.join(users_directory, new_txt_file_name))
    new_txt_subfile_name = new_file_name.replace('.js', '_sub.txt')
    create_duplicate_file('workertemp.txt', os.path.join(users_directory, new_txt_subfile_name))
    bot.send_message(call.message.chat.id, f"Duplicated 'workertemp.txt' as '{new_txt_file_name}' in 'users' directory.")
    new_file_name_without_extension = new_file_name.replace('.js', '')
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (selected_ip, new_file_name_without_extension))
    connection.commit()
    connection.close()
    user_states[call.from_user.id]['state'] = 'waiting_for_subdomain_or_worker_name'
    bot.send_message(call.message.chat.id, "Please enter the new subdomain for your worker: \n ℹ️ example: subdomain.yourdomain.com \n\n ℹ️ℹ️ DO NOT enter domain that you DO NOT HAVE !")

@bot.message_handler(func=lambda message: user_states.get(message.from_user.id, {}).get('state') == 'waiting_for_subdomain_or_worker_name')
def handle_subdomain_and_worker_name(message):
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return
    bot.delete_message(message.chat.id, message.message_id - 1)

    new_subdomain = message.text.strip()

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM user WHERE subdomain = ?', (new_subdomain,))
    existing_user = cursor.fetchone()
    connection.close()

    if existing_user:
        bot.send_message(message.chat.id, f"❌The subdomain '{new_subdomain}' already exists. Please enter a different subdomain.❌")
        
    else:
        new_file_name = user_states[message.from_user.id]['file_name']
        new_file_name_without_extension = new_file_name.replace('.js', '')

        user_uuid = user_states[message.from_user.id]['uuid']
        new_file_path = os.path.join(users_directory, new_file_name)
    
        new_txt_file_name = new_file_name.replace('.js', '.txt')
        new_txt_file_path = os.path.join(users_directory, new_txt_file_name)
        new_txt_subfile_name = new_file_name.replace('.js', '_sub.txt')
        new_txt_subfile_path = os.path.join(users_directory, new_txt_subfile_name)
        new_subfile_name = new_file_name_without_extension + "_sub.js"
        new_subsfile_path = os.path.join(users_directory, new_subfile_name)
        replace_subdomain_in_file(new_subdomain, new_txt_file_path)
        
        replace_subdomain_in_subfile(new_subdomain, new_subsfile_path)
        replace_ip_api(ip_api, new_subsfile_path)
        subworker_name = f"subworker{new_file_name_without_extension}"
        replace_name_in_file(new_txt_file_name, new_txt_file_path)
        replace_name_in_file(subworker_name, new_txt_subfile_path)

        subworker_host = f"sub{new_subdomain}"
        replace_subworker_host(subworker_host, new_file_path)
        replace_subdomain_in_file(subworker_host, new_txt_subfile_path)
        bot.send_message(message.chat.id, f"🌐Uploading your new user using Wrangler...🌐\n ⌛ WAIT ~ 30s-1m ⌛")
        
        update_wrangler_toml(new_txt_file_path)
        sent_message = bot.send_message(message.chat.id, "⌛")
        wait_message_id = sent_message.message_id

        
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()
        cursor.execute('UPDATE user SET subdomain = ? WHERE name = ?', (new_subdomain, new_file_name_without_extension))
        connection.commit()
        connection.close()
        
        new_js_file_path = os.path.join(users_directory, new_file_name)
        
        deployment_status = run_nvm_use_and_wrangler_deploy(new_js_file_path)

        
        if deployment_status:
            bot.delete_message(message.chat.id, wait_message_id)
            bot.send_message(message.chat.id, "✅✅ Workers Deployment successful!✅✅")
            update_wrangler_toml(new_txt_subfile_path)
            run_nvm_use_and_wrangler_deploy(new_subsfile_path)
            vless_config = create_vless_config(new_subdomain, user_uuid, new_file_name)
            nontls_config = create_nontls_config(new_subdomain, user_uuid, new_file_name)
            sub_link = f"https://{subworker_host}/{new_file_name_without_extension}"
            non_tls_config_html = f"<code>{nontls_config}</code>"
            vless_config_html = f"<code>{vless_config}</code>"
            message_text = f"Config: {vless_config_html}\n\n NoTls: {non_tls_config_html}\n\n Sub link: {sub_link}"
            menu_markup = InlineKeyboardMarkup()
            add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
            user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
            menu_markup.add(add_user_button, user_panel_button)
            bot.send_message(message.chat.id, message_text, reply_markup=menu_markup, parse_mode="HTML")
            del user_states[message.from_user.id]

        else:
            bot.delete_message(message.chat.id, wait_message_id)
            menu_markup = InlineKeyboardMarkup()
            add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
            user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
            menu_markup.add(add_user_button, user_panel_button)
            bot.send_message(message.chat.id, "❌Deployment failed. Please check the logs.❌", reply_markup=menu_markup)

def create_vless_config(new_subdomain, user_uuid, new_file_name):
    if new_file_name.endswith('.js'):
        new_file_name = new_file_name[:-3]

    vless_config = f"vless://{user_uuid}@{new_subdomain}:443?encryption=none&security=tls&sni={new_subdomain}&fp=randomized&type=ws&host={new_subdomain}&path=%2F%3Fed%3D2048#{new_file_name}"
    return vless_config

def create_nontls_config(new_subdomain, user_uuid, new_file_name):
    if new_file_name.endswith('.js'):
        new_file_name = new_file_name[:-3]

    nontls_config = f"vless://{user_uuid}@{new_subdomain}:80?encryption=none&security=&sni={new_subdomain}&fp=randomized&type=ws&host={new_subdomain}&path=%2F%3Fed%3D2048#{new_file_name}"
    return nontls_config

def run_nvm_use_and_wrangler_deploy(new_file_path):
    nvm_source_command = 'source ~/.nvm/nvm.sh && '

    subprocess.run(['bash', '-c', f'{nvm_source_command} nvm use 16.17.0'], check=True)

    result = subprocess.run(['bash', '-c', f'{nvm_source_command} npx wrangler deploy {new_file_path}'], capture_output=True, text=True, check=False)

    print(result.stdout)

    return "Current Deployment ID:" in result.stdout


def update_wrangler_toml(new_txt_file_path):
    wrangler_toml_path = 'wrangler.toml'
    with open(new_txt_file_path, 'r') as file:
        new_txt_content = file.read()

    with open(wrangler_toml_path, 'w') as file:
        file.write(new_txt_content)


def replace_name_in_file(name, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    name_without_extension = name.replace('.txt', '')  
    modified_contents = file_contents.replace('name = "nameofworker"', f'name = "{name_without_extension}"')
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def replace_path_in_subfile(path, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace("let mytoken= 'username';", f"let mytoken= '{path}';")
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def replace_ip_api(ip_api, file_path):
    with open('.env', 'r') as env_file:
        for line in env_file:
            if line.startswith('IP_API='):
                env_ip_api = line.strip().split('=')[1].strip("'")

    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace(f"let addressesapi = ['addressapi'];", f"let addressesapi = ['{env_ip_api}'];")
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def replace_subdomain_in_subfile(subdomain, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace("host = env.HOST || 'usersubdomain';", f"host = env.HOST || '{subdomain}';")
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def replace_subdomain_in_file(subdomain, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace('pattern = "subdomain"', f'pattern = "{subdomain}"')
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def create_duplicate_file(original_file, new_file):
    with open(original_file, 'r') as file:
        original_contents = file.read()
    with open(new_file, 'w') as new_file:
        new_file.write(original_contents)

def generate_uuid():
    user_uuid = uuid.uuid4()
    return str(user_uuid)

def replace_uuid_in_sub_file(uuid, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace("uuid = env.UUID || 'uuid';", f"uuid = env.UUID || '{uuid}';")
    with open(file_path, 'w') as file:
        file.write(modified_contents)
        
def replace_subworker_host(workerhost, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace("let sub = 'subworkerhost';", f"let sub = '{workerhost}';")
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def replace_uuid_in_file(uuid, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace("let userID = 'uuid';", f"let userID = '{uuid}';")
    with open(file_path, 'w') as file:
        file.write(modified_contents)

def replace_proxy_ip_in_file(proxy_ip, file_path):
    with open(file_path, 'r') as file:
        file_contents = file.read()
    modified_contents = file_contents.replace("let proxyIP = 'newproxy';", f"let proxyIP = '{proxy_ip}';")
    with open(file_path, 'w') as file:
        file.write(modified_contents)

# single Ctrl+C termination
# def start_bot():
#     bot.polling(none_stop=False)
#     #         except KeyboardInterrupt:
# #             print("\nBot has been stopped.")
# #             break

# non stop pull , for termination hold Ctrl+c        
def start_bot():
    while True:
        try:
            bot.polling(none_stop=True)
        except KeyboardInterrupt:
            print("\nBot has been stopped.")
            break
        except Exception as e:
            print(f"An error occurred: {e}")
            time.sleep(10)

if __name__ == "__main__":
    print("✅ CFW BOT STARTED ✅\n ✌️ RISE UP AND FIGHT FOR FREEDOM ✌️")
    start_bot()
