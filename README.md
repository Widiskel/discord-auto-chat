# Discord Auto Chat Bot

auto send chat on discord specific channel, good for push rank level on MEE bot and another level basead bot

## Setup
1. Clone Project and CD to Project dir
   ```bash
   git clone https://github.com/Widiskel/discord-auto-chat
   cd discord-auto-chat
   ```
2. Install package
   ```bash
   npm install
   ```
3. configure enviroment variable, copy .env.example to .env and run
   ```bash
   nano .env
   ```
   environment example
   ```bash
   DISCORD_EMAIL=YOUR@EMAIL
   DISCORD_PASSWORD=YOURPASSWORD
   USE_QR=1 for ON 0 for OFF
   TARGET_CHAT_CHANNEL=https://discord.com/channels/123123/123123123
   DELAY_EACH_CHAT_IN_SECONDS=70
   HEADLESS=1 for ON 0 for OFF
   BROWSEREXECUTABLEPATH=/path/to/chrome
   ```
5. Run Bot
   ```bash
   npm run start
   ```

## Note

if you want to see browser pop up , edit HEADLESS on .env to false
Change the `/src/utils/messages.js` with your word list

## Additional Setup ON Ubuntu
```bash
sudo apt-get update
sudo apt-get install chromium-browser
sudo mkdir -p /opt/google/chrome
sudo ln -sf $(which chromium-browser) /opt/google/chrome/chrome
```
