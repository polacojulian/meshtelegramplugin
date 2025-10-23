# Changelog

All notable changes to the MeshCentral Telegram Device Notifier plugin will be documented in this file.

## [1.0.0] - 2024-10-23

### Added
- Initial release of MeshCentral Telegram Device Notifier
- Real-time Telegram notifications for new device registrations
- Comprehensive device information collection including:
  - Device name and platform
  - Operating System details
  - IP Address
  - CPU information
  - GPU information  
  - RAM details (total, free, used)
  - **Antivirus detection and status** (enabled/disabled, update status)
  - Agent version
  - Device tags
  - Registration timestamp
- Smart detection to differentiate new devices from reconnections
- Existing device tracking to prevent duplicate notifications
- Rich Markdown-formatted messages with emojis
- Error handling and debug logging
- Secure HTTPS communication with Telegram Bot API

### Features
- Loads existing devices on startup to avoid false notifications
- Event-driven architecture using MeshCentral's event dispatch system
- Platform detection (Windows, Linux, macOS, FreeBSD)
- Human-readable byte formatting for memory information
- Markdown escaping for safe message formatting
- Configurable bot token and chat ID

### Security
- No proxy usage for API calls
- Secure credential handling
- HTTPS-only communication with Telegram

### Documentation
- Complete installation guide
- Telegram bot setup instructions
- Configuration examples
- Troubleshooting section
- Security best practices

## Future Versions

### Planned Features
- [ ] Web-based configuration interface
- [ ] Support for multiple Telegram recipients
- [ ] Custom notification templates
- [ ] Device offline/disconnect notifications
- [ ] Notification filters by device group
- [ ] Device tags-based filtering
- [ ] Notification scheduling/quiet hours
- [ ] Statistics and reporting
- [ ] Environment variable support for credentials
- [ ] Docker-friendly configuration

