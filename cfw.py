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

bot_token = os.getenv('BOT_TOKEN')
account_id = os.getenv('ACCOUNT_ID')
api_token = os.getenv('CLOUDFLARE_API_TOKEN')
admin_user_id = os.getenv('ADMIN_USER_ID')
bot = telebot.TeleBot(bot_token)
user_states = {}
users_directory = 'users'
index_js_path = 'index.js'
db_path = 'cfw.db'

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
    menu_markup.add(add_user_button, user_panel_button)
    
    welcome_message = "Welcome to C-F-W Bot!\n ✌️ RISE AND FIGHT FOR FREEDOM ✌️ !\n "
    
    bot.send_message(message.chat.id, welcome_message, reply_markup=menu_markup)


@bot.callback_query_handler(func=lambda call: call.data == 'return')
def return_to_start(call):
    send_welcome(call.message)
    bot.delete_message(call.message.chat.id, call.message.message_id)
@bot.callback_query_handler(func=lambda call: call.data.startswith('user_panel'))
def user_panel_cfw(call):
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

    return_button = InlineKeyboardButton("🔙 Return", callback_data="return")
    keyboard.add( return_button)
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

        message_text = f"<b>🔰USER INFO🔰</b>\n\n"
        message_text += f"👤 <b>Name:</b> {user_name}\n"
        message_text += f"🔑 <b>UUID:</b> {uuid}\n"
        message_text += f"🌐 <b>IP:</b> {ip}\n"
        message_text += f"📡 <b>Subdomain:</b> {subdomain}\n\n"
        message_text += f"🔗🔗: <code>{vless_link}</code>"

        keyboard = InlineKeyboardMarkup()
        delete_button = InlineKeyboardButton("🗑️ Delete", callback_data=f"delete:{user_name}")
        qr_button = InlineKeyboardButton("🔲 QR", callback_data=f"qr:{user_name}")
        return_button = InlineKeyboardButton("🔙 Return", callback_data="user_panel")
        keyboard.add(delete_button, qr_button, return_button)

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
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(vless_link)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="black", back_color="white")

    img_bytes = BytesIO()
    qr_img.save(img_bytes, format='PNG')
    img_bytes.seek(0)

    bot.send_photo(call.message.chat.id, img_bytes, caption="🤳 Scan Me! 🤳")

    del img_bytes
@bot.callback_query_handler(func=lambda call: call.data.startswith('delete:'))
def delete_user(call):
    bot.delete_message(call.message.chat.id, call.message.message_id)
    user_name = call.data.split(':')[1]

    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()

    delete_worker(account_id, api_token, user_name)

    cursor.execute('DELETE FROM user WHERE name = ?', (user_name,))
    connection.commit()

    connection.close()

    menu_markup = InlineKeyboardMarkup()
    add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
    user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
    menu_markup.add(add_user_button, user_panel_button)
    bot.send_message(call.message.chat.id, f"✅ Worker for user '{user_name}' deleted successfully.✅", reply_markup=menu_markup)
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
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return

    new_file_name = message.text.strip() + ".js"
    new_file_name_without_extension = new_file_name.replace('.js', '')

    if not os.path.exists(users_directory):
        os.makedirs(users_directory)
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('SELECT * FROM user WHERE name = ?', (new_file_name_without_extension,))
    existing_user = cursor.fetchone()
    connection.close()
    
    if existing_user:
        bot.send_message(message.chat.id, "User already exists with this name. Please enter a different name.")
    else:
        new_file_path = os.path.join(users_directory, new_file_name)
        
        create_duplicate_file(index_js_path, new_file_path)
        bot.send_message(message.chat.id, f"user '{new_file_name}' created.✅")
        
        user_uuid = generate_uuid()
        replace_uuid_in_file(user_uuid, new_file_path)
        bot.send_message(message.chat.id, f"uuid of new user ➡️ {user_uuid}")
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()
        cursor.execute('INSERT INTO user (name, uuid) VALUES (?, ?)', (new_file_name_without_extension, user_uuid))
        connection.commit()
        connection.close()
        user_states[message.from_user.id] = {'state': 'waiting_for_proxy', 'file_name':  new_file_name, 'uuid': user_uuid}
        bot.send_message(message.chat.id, "Please enter the new CloudFlare IP or CloudFlare domain:")

@bot.message_handler(func=lambda message: user_states.get(message.from_user.id, {}).get('state') == 'waiting_for_proxy')
def handle_proxy(message):
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return

    new_proxy_ip = message.text.strip()
    
    new_file_name = user_states[message.from_user.id]['file_name']
    
    new_file_path = os.path.join(users_directory, new_file_name)
    
    replace_proxy_ip_in_file(new_proxy_ip, new_file_path)
    bot.send_message(message.chat.id, f"New proxy setting added ➡️ {new_proxy_ip}")

    new_txt_file_name = new_file_name.replace('.js', '.txt')
    create_duplicate_file('workertemp.txt', os.path.join(users_directory, new_txt_file_name))
    bot.send_message(message.chat.id, f"Duplicated 'workertemp.txt' as '{new_txt_file_name}' in 'users' directory.")
    new_file_name_without_extension = new_file_name.replace('.js', '')
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    cursor.execute('UPDATE user SET ip = ? WHERE name = ?', (new_proxy_ip, new_file_name_without_extension))
    connection.commit()
    connection.close()
    user_states[message.from_user.id]['state'] = 'waiting_for_subdomain_or_worker_name'
    bot.send_message(message.chat.id, "Please enter the new subdomain for your worker: \n ℹ️ example: subdomain.yourdomain.com \n\n ℹ️ℹ️ DO NOT enter domain that you DO NOT HAVE !")    

@bot.message_handler(func=lambda message: user_states.get(message.from_user.id, {}).get('state') == 'waiting_for_subdomain_or_worker_name')
def handle_subdomain_and_worker_name(message):
    if message.text.strip().lower() == 'cancel':
        del user_states[message.from_user.id]
        bot.send_message(message.chat.id, "❌Process canceled.❌")
        send_welcome(message)
        return

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
        user_uuid = user_states[message.from_user.id]['uuid']

        new_txt_file_name = new_file_name.replace('.js', '.txt')
        new_txt_file_path = os.path.join(users_directory, new_txt_file_name)
        
        replace_subdomain_in_file(new_subdomain, new_txt_file_path)
        replace_name_in_file(new_txt_file_name, new_txt_file_path)
        
        bot.send_message(message.chat.id, f"🌐Uploading your new user using Wrangler...🌐\n ⌛ WAIT ~ 30s-1m ⌛")
        
        update_wrangler_toml(new_txt_file_path)
        sent_message = bot.send_message(message.chat.id, "⌛")
        wait_message_id = sent_message.message_id


        new_file_name_without_extension = new_file_name.replace('.js', '')
        
        connection = sqlite3.connect(db_path)
        cursor = connection.cursor()
        cursor.execute('UPDATE user SET subdomain = ? WHERE name = ?', (new_subdomain, new_file_name_without_extension))
        connection.commit()
        connection.close()
        
        new_js_file_path = os.path.join(users_directory, new_file_name)
        
        deployment_status = run_nvm_use_and_wrangler_deploy(new_js_file_path)

        
        if deployment_status:
            bot.delete_message(message.chat.id, wait_message_id)
            bot.send_message(message.chat.id, "✅✅ Worker Deployment successful!✅✅")
            vless_config = create_vless_config(new_subdomain, user_uuid, new_file_name)
            vless_config_html = f"<code>{vless_config}</code>"
            menu_markup = InlineKeyboardMarkup()
            add_user_button = InlineKeyboardButton("➕ Add User", callback_data="add_user")
            user_panel_button = InlineKeyboardButton("🔰 User Panel", callback_data="user_panel")
            menu_markup.add(add_user_button, user_panel_button)
            bot.send_message(message.chat.id, vless_config_html, reply_markup=menu_markup, parse_mode="HTML")
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


def start_bot():
    while True:
        try:
            bot.polling(none_stop=True)
        except Exception as e:
            print(f"An error occurred: {e}")
            time.sleep(10)


if __name__ == "__main__":
    print("✅ CFW BOT STARTED ✅\n ✌️ RISE UP AND FIGHT FOR FREEDOM ✌️")
    start_bot()

