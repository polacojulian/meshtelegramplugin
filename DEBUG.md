# Debugging Guide

The plugin now includes comprehensive console logging to help identify issues.

## How to View Debug Logs

### Method 1: View MeshCentral Console Output
When you start MeshCentral, watch the console for these messages:

```
===========================================
Telegram Notifier Plugin - Starting
===========================================
Bot Token configured: YES/NO
Chat ID configured: YES/NO
Plugin enabled: true
MeshServer available: YES
Event dispatcher registered
Loading existing devices to avoid false notifications...
Loaded X existing devices into memory
Monitoring for new device registrations
===========================================
```

### Method 2: View MeshCentral Logs
Check your MeshCentral log file (usually in `meshcentral-data/meshcentral.log`)

## What to Look For

### 1. Plugin Startup
If you see the startup banner, the plugin loaded successfully:
```
Telegram Notifier Plugin - Starting
```

### 2. Event Detection
When ANY event happens, you'll see:
```
📥 EVENT RECEIVED: [action] | NodeID: [id]
```

### 3. New Device Detection
When a new device is detected:
```
🔍 Device event detected: addnode | NodeID: node//...
🆕 NEW DEVICE DETECTED! node//...
   This device is NOT in the seen list, will send notification
📋 Fetching device info for: node//...
✅ Node data retrieved: [Device Name]
📦 Device info compiled: {...}
✅ Device info retrieved: [Device Name]
```

### 4. Telegram Notification
When sending to Telegram:
```
📤 Preparing to send Telegram notification...
✅ Credentials OK, formatting message...
📨 Sending to Telegram API...
   Chat ID: -123456789
   Message length: 450
📮 Request sent to Telegram API
✅ Telegram notification sent successfully!
   Device: [Device Name]
```

## Common Issues

### Issue 1: No Startup Banner
**Problem**: Plugin not loading
**Check**:
- Is the plugin in the correct directory? `meshcentral-data/plugins/telegram_notifier/`
- Is the file named correctly? `telegram_notifier.js`
- Check MeshCentral logs for plugin errors

### Issue 2: Startup Banner Shows But No Events
**Problem**: Not receiving events
**Check**:
- You should see `📥 EVENT RECEIVED:` for EVERY event
- If you don't see ANY events, the event dispatcher may not be working
- Try restarting MeshCentral

### Issue 3: Events Received But Device Already Seen
**Problem**: Device is already in the seenDevices list
**You'll see**:
```
🔍 Device event detected: ...
⏭️  Device already seen, skipping notification
```
**Solution**: This is NORMAL for existing devices. Only NEW devices trigger notifications.

### Issue 4: Credentials Not Configured
**You'll see**:
```
❌ Telegram credentials not configured!
```
**Solution**: Edit `telegram_notifier.js` and set your bot token and chat ID

### Issue 5: Telegram API Error
**You'll see**:
```
❌ Telegram API error!
   Status: 400
   Response: {...}
```
**Common causes**:
- Invalid bot token
- Invalid chat ID
- Bot not added to group/channel
- Bot doesn't have permission to send messages

## Testing the Plugin

### Option 1: Enable Test Mode
In `telegram_notifier.js`, uncomment these lines (around line 365):

```javascript
console.log('🧪 Testing Telegram connection...');
setTimeout(function() {
    obj.sendTelegramNotification({
        name: 'TEST DEVICE',
        platform: 'Test',
        osDesc: 'Plugin Test',
        ip: '127.0.0.1',
        nodeId: 'node//test123',
        cpu: 'Test CPU',
        gpu: 'Test GPU',
        ram: '16 GB',
        ramTotal: '16 GB',
        ramFree: '8 GB',
        agentVersion: '1.0.0',
        tags: 'test',
        antivirus: []
    });
}, 5000); // Test after 5 seconds
```

This will send a test notification 5 seconds after plugin startup.

### Option 2: Clear Seen Devices
To make the plugin treat existing devices as new:
1. Stop MeshCentral
2. Edit `telegram_notifier.js`
3. Comment out the `obj.loadExistingDevices();` line (around line 42)
4. Restart MeshCentral
5. Existing devices that reconnect will now trigger notifications
6. **Important**: Uncomment the line after testing!

## Expected Console Output Example

```
===========================================
Telegram Notifier Plugin - Starting
===========================================
Bot Token configured: YES
Chat ID configured: YES
Plugin enabled: true
MeshServer available: YES
Event dispatcher registered
Loading existing devices to avoid false notifications...
Loaded 5 existing devices into memory
Monitoring for new device registrations
===========================================

📥 EVENT RECEIVED: changenode | NodeID: node//ABC123
🔍 Device event detected: changenode | NodeID: node//ABC123
⏭️  Device already seen, skipping notification

📥 EVENT RECEIVED: addnode | NodeID: node//XYZ789
🔍 Device event detected: addnode | NodeID: node//XYZ789
🆕 NEW DEVICE DETECTED! node//XYZ789
   This device is NOT in the seen list, will send notification
📋 Fetching device info for: node//XYZ789
✅ Node data retrieved: Office-PC
📦 Device info compiled: {
  "name": "Office-PC",
  "platform": "Windows",
  ...
}
✅ Device info retrieved: Office-PC
📤 Preparing to send Telegram notification...
✅ Credentials OK, formatting message...
📨 Sending to Telegram API...
   Chat ID: -4806642343
   Message length: 385
📮 Request sent to Telegram API
✅ Telegram notification sent successfully!
   Device: Office-PC
```

## Still Not Working?

1. Copy the FULL console output (from plugin start to the issue)
2. Check what events are being received
3. Verify your Telegram bot token is correct
4. Test your bot manually: `https://api.telegram.org/bot<YOUR_TOKEN>/getMe`
5. Verify your chat ID is correct (use negative number for groups)
6. Check MeshCentral version compatibility (requires >=0.9.0)

## Disable Verbose Logging

Once everything works, you can reduce logging by removing/commenting out the `console.log()` statements in `telegram_notifier.js`.

