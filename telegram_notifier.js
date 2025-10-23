/**
 * MeshCentral Telegram Device Notifier Plugin
 * Sends Telegram notifications when new devices are registered
 */

module.exports.telegram_notifier = function(parent) {
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.common = parent.parent.common;
    obj.https = require('https');
    
    // Configuration - You can modify these values
    obj.config = {
        botToken: "7665554365:AAFT_g5CqzV7SegnyU41coIdljZbPXluJQM",
        chatId: "-4806642343",
        enabled: true
    };
    
    // Track devices we've already seen to avoid duplicate notifications
    obj.seenDevices = new Set();
    
    /**
     * Initialize the plugin
     */
    obj.start = function() {
        console.log('===========================================');
        console.log('Telegram Notifier Plugin - Starting');
        console.log('===========================================');
        console.log('Bot Token configured:', obj.config.botToken ? 'YES' : 'NO');
        console.log('Chat ID configured:', obj.config.chatId ? 'YES' : 'NO');
        console.log('Plugin enabled:', obj.config.enabled);
        console.log('MeshServer available:', obj.meshServer ? 'YES' : 'NO');
        
        obj.parent.parent.debug('telegram_notifier', 'Plugin started');
        
        // Hook into device connection events
        obj.meshServer.AddEventDispatch([obj]);
        console.log('Event dispatcher registered');
        
        // Load existing devices into seenDevices to avoid notifying on reconnects
        obj.loadExistingDevices();
        
        console.log('Monitoring for new device registrations');
        console.log('===========================================');
        obj.parent.parent.debug('telegram_notifier', 'Monitoring for new device registrations');
    };
    
    /**
     * Load all existing devices so we don't notify about them
     */
    obj.loadExistingDevices = function() {
        try {
            console.log('Loading existing devices to avoid false notifications...');
            var devices = obj.meshServer.db.file;
            if (devices) {
                var count = 0;
                for (var nodeid in devices) {
                    if (nodeid.startsWith('node//')) {
                        obj.seenDevices.add(nodeid);
                        count++;
                    }
                }
                console.log('Loaded ' + count + ' existing devices into memory');
                obj.parent.parent.debug('telegram_notifier', 'Loaded ' + count + ' existing devices');
            } else {
                console.log('No devices found in database');
            }
        } catch (ex) {
            console.log('ERROR loading existing devices:', ex.message);
            obj.parent.parent.debug('telegram_notifier', 'Error loading existing devices: ' + ex);
        }
    };
    
    /**
     * Handle MeshCentral events
     */
    obj.HandleEvent = function(source, entry, ids, id) {
        // Log ALL events to see what's happening
        console.log('📥 EVENT RECEIVED:', entry.action, entry.nodeid ? '| NodeID: ' + entry.nodeid : '');
        
        if (!obj.config.enabled) {
            console.log('⚠️  Plugin is disabled, ignoring event');
            return;
        }
        
        try {
            // Check for device change events that indicate a new device
            if (entry.action === 'addnode' || entry.action === 'changenode') {
                var nodeId = entry.nodeid;
                console.log('🔍 Device event detected:', entry.action, '| NodeID:', nodeId);
                
                // If this is a truly new device (not in our seen list)
                if (!obj.seenDevices.has(nodeId)) {
                    console.log('🆕 NEW DEVICE DETECTED!', nodeId);
                    console.log('   This device is NOT in the seen list, will send notification');
                    obj.seenDevices.add(nodeId);
                    
                    // Get full device information
                    obj.getDeviceInfo(nodeId, function(deviceInfo) {
                        if (deviceInfo) {
                            console.log('✅ Device info retrieved:', deviceInfo.name);
                            obj.sendTelegramNotification(deviceInfo);
                        } else {
                            console.log('❌ Failed to retrieve device info for', nodeId);
                        }
                    });
                } else {
                    console.log('⏭️  Device already seen, skipping notification');
                }
            }
        } catch (ex) {
            console.log('❌ ERROR in HandleEvent:', ex.message, ex.stack);
            obj.parent.parent.debug('telegram_notifier', 'Error in HandleEvent: ' + ex);
        }
    };
    
    /**
     * Get detailed device information
     */
    obj.getDeviceInfo = function(nodeId, callback) {
        console.log('📋 Fetching device info for:', nodeId);
        try {
            obj.meshServer.db.Get(nodeId, function(err, nodes) {
                if (err) {
                    console.log('❌ Database error:', err);
                    callback(null);
                    return;
                }
                if (!nodes || nodes.length === 0) {
                    console.log('⚠️  No nodes found for:', nodeId);
                    callback(null);
                    return;
                }
                
                var node = nodes[0];
                console.log('✅ Node data retrieved:', node.name || 'Unknown');
                var deviceInfo = {
                    name: node.name || 'Unknown Device',
                    nodeId: nodeId,
                    ip: node.host || 'N/A',
                    meshId: node.meshid || 'N/A',
                    platform: obj.getPlatformName(node.osdesc) || 'Unknown',
                    osDesc: node.osdesc || 'N/A',
                    cpu: 'N/A',
                    gpu: 'N/A',
                    ram: 'N/A',
                    ramTotal: 'N/A',
                    ramFree: 'N/A',
                    agentVersion: node.agent ? node.agent.ver : 'N/A',
                    lastConnection: node.conn ? new Date().toISOString() : 'N/A',
                    icon: node.icon || 1,
                    tags: node.tags ? node.tags.join(', ') : 'None',
                    antivirus: []
                };
                
                // Extract hardware info if available
                if (node.hardware) {
                    if (node.hardware.windows) {
                        // Windows specific info
                        if (node.hardware.windows.cpu) {
                            deviceInfo.cpu = node.hardware.windows.cpu[0] ? node.hardware.windows.cpu[0].caption : 'N/A';
                        }
                        if (node.hardware.windows.gpu) {
                            deviceInfo.gpu = node.hardware.windows.gpu[0] ? node.hardware.windows.gpu[0].caption : 'N/A';
                        }
                    } else if (node.hardware.linux) {
                        // Linux specific info
                        if (node.hardware.linux.cpu) {
                            deviceInfo.cpu = node.hardware.linux.cpu.model || 'N/A';
                        }
                    }
                    
                    // Memory info (common)
                    if (node.hardware.ram) {
                        deviceInfo.ram = obj.formatBytes(node.hardware.ram);
                    }
                }
                
                // Try to get real-time system info if device is connected
                if (node.conn && node.sysinfo) {
                    if (node.sysinfo.cpu) {
                        deviceInfo.cpu = node.sysinfo.cpu.model || deviceInfo.cpu;
                    }
                    if (node.sysinfo.memory) {
                        deviceInfo.ramTotal = obj.formatBytes(node.sysinfo.memory.total);
                        deviceInfo.ramFree = obj.formatBytes(node.sysinfo.memory.free);
                        deviceInfo.ram = deviceInfo.ramTotal;
                    }
                    if (node.sysinfo.gpus && node.sysinfo.gpus.length > 0) {
                        deviceInfo.gpu = node.sysinfo.gpus[0].model || deviceInfo.gpu;
                    }
                }
                
                // Get antivirus information
                if (node.av) {
                    deviceInfo.antivirus = node.av;
                } else if (node.hardware && node.hardware.windows && node.hardware.windows.av) {
                    deviceInfo.antivirus = node.hardware.windows.av;
                }
                
                console.log('📦 Device info compiled:', JSON.stringify(deviceInfo, null, 2));
                callback(deviceInfo);
            });
        } catch (ex) {
            console.log('❌ ERROR getting device info:', ex.message, ex.stack);
            obj.parent.parent.debug('telegram_notifier', 'Error getting device info: ' + ex);
            callback(null);
        }
    };
    
    /**
     * Get platform name from OS description
     */
    obj.getPlatformName = function(osdesc) {
        if (!osdesc) return 'Unknown';
        osdesc = osdesc.toLowerCase();
        if (osdesc.indexOf('windows') >= 0) return 'Windows';
        if (osdesc.indexOf('linux') >= 0) return 'Linux';
        if (osdesc.indexOf('darwin') >= 0 || osdesc.indexOf('mac') >= 0) return 'macOS';
        if (osdesc.indexOf('freebsd') >= 0) return 'FreeBSD';
        return 'Unknown';
    };
    
    /**
     * Format bytes to human readable format
     */
    obj.formatBytes = function(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    /**
     * Send notification to Telegram
     */
    obj.sendTelegramNotification = function(deviceInfo) {
        console.log('📤 Preparing to send Telegram notification...');
        if (!obj.config.botToken || !obj.config.chatId) {
            console.log('❌ Telegram credentials not configured!');
            obj.parent.parent.debug('telegram_notifier', 'Telegram credentials not configured');
            return;
        }
        
        console.log('✅ Credentials OK, formatting message...');
        // Format the message
        var message = '🆕 *New Device Registered*\n\n';
        message += '📱 *Device Name:* ' + obj.escapeMarkdown(deviceInfo.name) + '\n';
        message += '🔧 *Platform:* ' + obj.escapeMarkdown(deviceInfo.platform) + '\n';
        message += '💻 *OS:* ' + obj.escapeMarkdown(deviceInfo.osDesc) + '\n';
        message += '🌐 *IP Address:* `' + deviceInfo.ip + '`\n';
        message += '🔑 *Node ID:* `' + deviceInfo.nodeId.substring(0, 20) + '...`\n\n';
        
        message += '*Hardware Information:*\n';
        message += '⚙️ *CPU:* ' + obj.escapeMarkdown(deviceInfo.cpu) + '\n';
        message += '🎮 *GPU:* ' + obj.escapeMarkdown(deviceInfo.gpu) + '\n';
        message += '💾 *RAM:* ' + obj.escapeMarkdown(deviceInfo.ram) + '\n';
        
        if (deviceInfo.ramTotal !== 'N/A' && deviceInfo.ramFree !== 'N/A') {
            message += '   • Total: ' + obj.escapeMarkdown(deviceInfo.ramTotal) + '\n';
            message += '   • Free: ' + obj.escapeMarkdown(deviceInfo.ramFree) + '\n';
        }
        
        message += '\n*Security:*\n';
        if (deviceInfo.antivirus && deviceInfo.antivirus.length > 0) {
            deviceInfo.antivirus.forEach(function(av) {
                var avName = av.product || av.displayName || 'Unknown AV';
                var avState = '';
                if (av.enabled !== undefined) {
                    avState = av.enabled ? ' ✅' : ' ⚠️ (Disabled)';
                }
                var avUpdated = '';
                if (av.updated !== undefined) {
                    avUpdated = av.updated ? ' 🔄' : ' ⚠️ (Outdated)';
                }
                message += '🛡️ *Antivirus:* ' + obj.escapeMarkdown(avName) + avState + avUpdated + '\n';
            });
        } else {
            message += '🛡️ *Antivirus:* Not detected or N/A\n';
        }
        
        message += '\n*Additional Info:*\n';
        message += '🔄 *Agent Version:* ' + obj.escapeMarkdown(deviceInfo.agentVersion) + '\n';
        message += '🏷️ *Tags:* ' + obj.escapeMarkdown(deviceInfo.tags) + '\n';
        message += '⏰ *Registered:* ' + new Date().toLocaleString() + '\n';
        
        var postData = JSON.stringify({
            chat_id: obj.config.chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        
        console.log('📨 Sending to Telegram API...');
        console.log('   Chat ID:', obj.config.chatId);
        console.log('   Message length:', message.length);
        
        var options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: '/bot' + obj.config.botToken + '/sendMessage',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        var req = obj.https.request(options, function(res) {
            var data = '';
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                if (res.statusCode === 200) {
                    console.log('✅ Telegram notification sent successfully!');
                    console.log('   Device:', deviceInfo.name);
                    obj.parent.parent.debug('telegram_notifier', 'Notification sent successfully for: ' + deviceInfo.name);
                } else {
                    console.log('❌ Telegram API error!');
                    console.log('   Status:', res.statusCode);
                    console.log('   Response:', data);
                    obj.parent.parent.debug('telegram_notifier', 'Failed to send notification. Status: ' + res.statusCode + ', Response: ' + data);
                }
            });
        });
        
        req.on('error', function(e) {
            console.log('❌ HTTPS request error:', e.message);
            obj.parent.parent.debug('telegram_notifier', 'Error sending Telegram notification: ' + e.message);
        });
        
        req.write(postData);
        req.end();
        console.log('📮 Request sent to Telegram API');
    };
    
    /**
     * Escape markdown special characters for Telegram
     */
    obj.escapeMarkdown = function(text) {
        if (!text) return 'N/A';
        text = String(text);
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    };
    
    /**
     * Stop the plugin
     */
    obj.stop = function() {
        console.log('🛑 Telegram Notifier Plugin - Stopping');
        obj.meshServer.RemoveEventDispatch([obj]);
        obj.parent.parent.debug('telegram_notifier', 'Plugin stopped');
    };
    
    // Start the plugin
    obj.start();
    
    // Test function to verify Telegram connection (optional - uncomment to test)
    // Uncomment the lines below to test your Telegram bot on startup
    /*
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
    */
    
    return obj;
};

