# Quick Installation Guide

## For MeshCentral Users

### Option 1: Install via URL (Easiest)

1. Open MeshCentral web interface
2. Go to **My Server** → **Plugins**
3. Click **Install Plugin**
4. Paste one of these URLs:
   ```
   https://raw.githubusercontent.com/polacojulian/meshtelegramplugin/main/config.json
   ```
   OR
   ```
   https://github.com/polacojulian/meshtelegramplugin
   ```
5. Click **Install**
6. **Configure your Telegram credentials** (see below)
7. Restart MeshCentral

### Option 2: Clone from GitHub

```bash
cd meshcentral-data/plugins/
git clone https://github.com/polacojulian/meshtelegramplugin.git telegram_notifier
cd telegram_notifier
# Edit telegram_notifier.js with your credentials
# Restart MeshCentral
```

### Option 3: Download ZIP

1. Download: https://github.com/polacojulian/meshtelegramplugin/archive/refs/heads/main.zip
2. Extract to `meshcentral-data/plugins/telegram_notifier/`
3. Configure credentials (see below)
4. Restart MeshCentral

## ⚠️ IMPORTANT: Configure Your Credentials

After installation, you MUST edit the plugin file:

1. Navigate to: `meshcentral-data/plugins/telegram_notifier/telegram_notifier.js`
2. Find line 14 (obj.config section)
3. Replace the placeholder credentials:

```javascript
obj.config = {
    botToken: "YOUR_BOT_TOKEN_HERE",  // From @BotFather
    chatId: "YOUR_CHAT_ID_HERE",      // Your Telegram chat ID
    enabled: true
};
```

4. Save and restart MeshCentral

## Get Telegram Credentials

### Bot Token:
1. Open Telegram, search [@BotFather](https://t.me/BotFather)
2. Send: `/newbot`
3. Follow instructions
4. Copy the token

### Chat ID:
- **Personal**: Search [@userinfobot](https://t.me/userinfobot), start chat, copy ID
- **Group**: Add bot to group, send message, visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`, find chat ID

## Test Installation

1. Register a new device to MeshCentral
2. Check your Telegram for notification
3. If no notification, check MeshCentral logs for `telegram-notifier` messages

## Notification Example

You'll receive:
```
🆕 New Device Registered

📱 Device Name: Office-PC
🔧 Platform: Windows
💻 OS: Windows 10 Pro (x64)
🌐 IP Address: 192.168.1.100
🔑 Node ID: node//ABC123...

Hardware Information:
⚙️ CPU: Intel Core i7-9700K @ 3.60GHz
🎮 GPU: NVIDIA GeForce RTX 2060
💾 RAM: 16.00 GB

Security:
🛡️ Antivirus: Windows Defender ✅ 🔄

Additional Info:
🔄 Agent Version: 1.0.95
🏷️ Tags: Office, Desktop
⏰ Registered: 10/23/2024, 2:30:15 PM
```

## Troubleshooting

**No notifications?**
- Verify bot token and chat ID
- Check bot has permission to send messages
- For groups, bot must be admin
- Check MeshCentral logs
- Test bot: `https://api.telegram.org/bot<TOKEN>/getMe`

**Plugin not loading?**
- Ensure plugins enabled in config.json
- Check file permissions
- Review MeshCentral error logs

## Support

For issues or questions, check the [full README](readme.md) or review MeshCentral plugin documentation.

