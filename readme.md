# MeshCentral Telegram Device Notifier

A MeshCentral plugin that automatically sends Telegram notifications whenever a new device is registered to your MeshCentral server.

## Features

- 🔔 **Real-time Notifications**: Get instant Telegram messages when new devices register
- 📊 **Comprehensive Device Info**: Includes IP, CPU, GPU, RAM, OS, and more
- 🎯 **Smart Detection**: Only notifies for NEW devices, not reconnections
- 🚀 **Easy Setup**: Simple configuration and installation
- 🔒 **Secure**: Uses Telegram Bot API for secure notifications

## Device Information Included

Each notification includes:
- Device name and platform
- Operating System details
- IP Address
- Node ID
- CPU information
- GPU information
- RAM (total, free, and used)
- **Antivirus information** (name, status, update status)
- Agent version
- Device tags
- Registration timestamp

## Prerequisites

Before installing this plugin, you need:

1. **MeshCentral server** with plugins enabled
2. **Telegram Bot Token** (get from [@BotFather](https://t.me/BotFather))
3. **Telegram Chat ID** (your personal chat or group chat ID)

## Installation

### Step 1: Enable Plugins in MeshCentral

Add this to your MeshCentral `config.json`:

```json
{
  "settings": {
    "plugins": {
      "enabled": true
    }
  }
}
```

Restart MeshCentral after making this change.

### Step 2: Install via GitHub (Recommended)

1. Go to **My Server** → **Plugins** in MeshCentral
2. Click **Install Plugin**
3. Enter this URL: `https://raw.githubusercontent.com/duboki/meshtelegramplugin/main/config.json`
4. Click **Install**
5. The plugin will be downloaded and installed automatically

### Step 3: Configure Telegram Credentials

⚠️ **IMPORTANT**: You must configure your Telegram credentials before the plugin will work!

1. Navigate to your MeshCentral plugins directory:
   ```
   meshcentral-data/plugins/telegram-notifier/
   ```

2. Open `telegram-notifier.js` in a text editor

3. Find the `obj.config` section (around line 14) and replace with your credentials:

```javascript
obj.config = {
    botToken: "YOUR_BOT_TOKEN_HERE",
    chatId: "YOUR_CHAT_ID_HERE",
    enabled: true
};
```

4. Save the file and restart MeshCentral

### Step 4: Manual Installation (Alternative)

If you prefer manual installation:

#### Method 1: Clone from GitHub

```bash
cd meshcentral-data/plugins/
git clone https://github.com/duboki/meshtelegramplugin.git telegram-notifier
```

#### Method 2: Download ZIP

1. Download: https://github.com/duboki/meshtelegramplugin/archive/refs/heads/main.zip
2. Extract to: `meshcentral-data/plugins/telegram-notifier/`
3. Configure credentials (see Step 3 above)
4. Restart MeshCentral

## Configuration

### Getting Your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token provided

### Getting Your Chat ID

**For personal notifications:**
1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start a chat with the bot
3. It will send you your Chat ID

**For group notifications:**
1. Add your bot to the group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":-XXXXXXXXX}` in the response

### Customizing Notifications

You can customize the notification format by editing the `sendTelegramNotification` function in `telegram-notifier.js`.

## How It Works

1. **Plugin Initialization**: When MeshCentral starts, the plugin loads all existing devices into memory
2. **Event Monitoring**: The plugin listens for device registration events
3. **New Device Detection**: When a device connects, it checks if it's truly new (not in the existing devices list)
4. **Info Collection**: Gathers comprehensive hardware and system information
5. **Telegram Notification**: Formats and sends a rich notification to your Telegram chat

## Troubleshooting

### Not receiving notifications?

1. **Check plugin is running**:
   - Look in MeshCentral logs for `telegram-notifier` messages
   - Enable debug mode in MeshCentral config

2. **Verify Telegram credentials**:
   - Test your bot token: `https://api.telegram.org/bot<TOKEN>/getMe`
   - Ensure chat ID is correct (use negative number for groups)

3. **Check bot permissions**:
   - Bot must be admin in group chats
   - Bot must have permission to send messages

4. **Firewall issues**:
   - Ensure MeshCentral server can reach `api.telegram.org` (port 443)

### Plugin not loading?

1. Verify plugins are enabled in config.json
2. Check file permissions
3. Review MeshCentral error logs
4. Ensure all plugin files are in the correct directory

## Security Notes

- ⚠️ **Never commit your bot token** to public repositories
- 🔒 Store credentials securely
- 🛡️ Use environment variables for production deployments
- 👥 Restrict bot access to trusted users only

## Future Enhancements

Potential features for future versions:
- Configuration via MeshCentral web interface
- Multiple Telegram recipients
- Custom notification templates
- Device offline notifications
- Notification filters by device group/tag

## Support

For issues, questions, or contributions:
- Review the MeshCentral plugin documentation
- Check MeshCentral forums
- Examine debug logs

## License

Apache License 2.0 - See LICENSE file for details

## Credits

Built for MeshCentral by following the official plugin structure.

---

**Note**: This plugin is designed to work with MeshCentral 0.9.0 and above.

