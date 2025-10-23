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
        obj.parent.parent.debug('telegram-notifier', 'Plugin started');
        
        // Hook into device connection events
        obj.meshServer.AddEventDispatch([obj]);
        
        // Load existing devices into seenDevices to avoid notifying on reconnects
        obj.loadExistingDevices();
        
        obj.parent.parent.debug('telegram-notifier', 'Monitoring for new device registrations');
    };
    
    /**
     * Load all existing devices so we don't notify about them
     */
    obj.loadExistingDevices = function() {
        try {
            var devices = obj.meshServer.db.file;
            if (devices) {
                for (var nodeid in devices) {
                    if (nodeid.startsWith('node//')) {
                        obj.seenDevices.add(nodeid);
                    }
                }
                obj.parent.parent.debug('telegram-notifier', 'Loaded ' + obj.seenDevices.size + ' existing devices');
            }
        } catch (ex) {
            obj.parent.parent.debug('telegram-notifier', 'Error loading existing devices: ' + ex);
        }
    };
    
    /**
     * Handle MeshCentral events
     */
    obj.HandleEvent = function(source, entry, ids, id) {
        if (!obj.config.enabled) return;
        
        try {
            // Check for device change events that indicate a new device
            if (entry.action === 'addnode' || entry.action === 'changenode') {
                var nodeId = entry.nodeid;
                
                // If this is a truly new device (not in our seen list)
                if (!obj.seenDevices.has(nodeId)) {
                    obj.seenDevices.add(nodeId);
                    
                    // Get full device information
                    obj.getDeviceInfo(nodeId, function(deviceInfo) {
                        if (deviceInfo) {
                            obj.sendTelegramNotification(deviceInfo);
                        }
                    });
                }
            }
        } catch (ex) {
            obj.parent.parent.debug('telegram-notifier', 'Error in HandleEvent: ' + ex);
        }
    };
    
    /**
     * Get detailed device information
     */
    obj.getDeviceInfo = function(nodeId, callback) {
        try {
            obj.meshServer.db.Get(nodeId, function(err, nodes) {
                if (err || !nodes || nodes.length === 0) {
                    callback(null);
                    return;
                }
                
                var node = nodes[0];
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
                
                callback(deviceInfo);
            });
        } catch (ex) {
            obj.parent.parent.debug('telegram-notifier', 'Error getting device info: ' + ex);
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
        if (!obj.config.botToken || !obj.config.chatId) {
            obj.parent.parent.debug('telegram-notifier', 'Telegram credentials not configured');
            return;
        }
        
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
                    obj.parent.parent.debug('telegram-notifier', 'Notification sent successfully for: ' + deviceInfo.name);
                } else {
                    obj.parent.parent.debug('telegram-notifier', 'Failed to send notification. Status: ' + res.statusCode + ', Response: ' + data);
                }
            });
        });
        
        req.on('error', function(e) {
            obj.parent.parent.debug('telegram-notifier', 'Error sending Telegram notification: ' + e.message);
        });
        
        req.write(postData);
        req.end();
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
        obj.meshServer.RemoveEventDispatch([obj]);
        obj.parent.parent.debug('telegram-notifier', 'Plugin stopped');
    };
    
    // Start the plugin
    obj.start();
    
    return obj;
};

