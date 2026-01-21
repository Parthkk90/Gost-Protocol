# Ghost Protocol ESP32 Requirements

## Arduino IDE Libraries

Install these libraries via Arduino IDE Library Manager:

1. **ArduinoJson** (by Benoit Blanchon)
   - Version: 6.21.0 or later
   - Used for: JSON parsing of RPC responses
   - Installation: Tools → Manage Libraries → Search "ArduinoJson"

2. **WiFi** (Pre-installed with ESP32)
   - Used for: WiFi connectivity
   - No installation needed (included with ESP32 board package)

3. **HTTPClient** (Pre-installed with ESP32)
   - Used for: Making HTTP requests to RPC endpoints
   - No installation needed (included with ESP32 board package)

4. **WebServer** (Pre-installed with ESP32)
   - Used for: Hosting the web dashboard
   - No installation needed (included with ESP32 board package)

5. **ArduinoOTA** (Optional - Pre-installed)
   - Used for: Over-the-air firmware updates
   - No installation needed if OTA is enabled

## ESP32 Board Package

Install ESP32 support in Arduino IDE:

1. Add Board Manager URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```

2. Install "esp32 by Espressif Systems"
   - Minimum version: 2.0.0
   - Recommended: Latest stable version

## PlatformIO Dependencies

If using PlatformIO, dependencies are auto-installed from `platformio.ini`:

```ini
lib_deps = 
    bblanchon/ArduinoJson@^6.21.0
```

## System Requirements

### Development Computer
- **OS**: Windows 10/11, macOS 10.14+, or Linux
- **RAM**: 4GB minimum, 8GB recommended
- **USB Port**: For programming ESP32
- **Internet**: For downloading libraries and uploading to ESP32

### ESP32 Hardware
- **ESP32 Board**: Any variant with WiFi
  - ESP32-DevKitC (recommended)
  - ESP32-WROOM-32
  - ESP32-S3
  - ESP32-C3
  - NodeMCU-32S

- **Memory Requirements**:
  - Flash: Minimum 4MB (default on most boards)
  - RAM: Minimum 320KB (standard on ESP32)
  - Note: ESP32-S3 with PSRAM recommended for larger storms

- **Power Requirements**:
  - USB power (5V, 500mA) sufficient for development
  - For deployment: 5V 1A power supply recommended

### Network Requirements
- **WiFi**: 2.4GHz network (ESP32 does not support 5GHz)
- **Internet**: Outbound HTTPS access required
- **Ports**: Outbound port 443 (HTTPS) for RPC endpoints
- **Firewall**: Allow ESP32 IP for dashboard access (port 80)

## External Services (Optional)

### RPC Providers (Free Tier Available)
- Infura: https://infura.io
- Alchemy: https://alchemy.com
- QuickNode: https://quicknode.com
- Public RPC endpoints (included by default)

### Time Sync
- NTP servers (public, free):
  - pool.ntp.org
  - time.nist.gov

## Compatibility Matrix

| Component | Minimum Version | Recommended | Notes |
|-----------|----------------|-------------|-------|
| Arduino IDE | 1.8.19 | 2.2.0+ | IDE 2.x has better UI |
| ESP32 Core | 2.0.0 | Latest | Newer = more features |
| ArduinoJson | 6.19.0 | 6.21.0+ | v6.x required |
| PlatformIO | 6.0.0 | Latest | For advanced users |

## Supported ESP32 Variants

| Board | Status | Notes |
|-------|--------|-------|
| ESP32-DevKitC | ✅ Tested | Recommended |
| ESP32-WROOM-32 | ✅ Tested | Works well |
| ESP32-S3 | ✅ Tested | Best performance (PSRAM) |
| ESP32-C3 | ⚠️ Compatible | Less RAM, reduce storm intensity |
| ESP32-S2 | ⚠️ Compatible | WiFi only (no Bluetooth) |
| ESP8266 | ❌ Not supported | Insufficient memory |

## USB Drivers

### Windows
Download and install appropriate driver:
- **CP210x**: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- **CH340**: http://www.wch-ic.com/downloads/CH341SER_EXE.html

### macOS
- CP210x: Usually auto-detected
- CH340: May require manual driver installation

### Linux
- Usually works out of the box
- Add user to dialout group: `sudo usermod -a -G dialout $USER`

## Troubleshooting

### Library Installation Issues
```bash
# Arduino IDE: Clear cache
# Close IDE, then delete:
# Windows: C:\Users\[User]\AppData\Local\Temp\arduino_*
# macOS: ~/Library/Arduino15/
# Linux: ~/.arduino15/
```

### PlatformIO Issues
```bash
# Clear PlatformIO cache
pio lib install --force
pio run --target clean
```

### Memory Issues
If you encounter memory errors:
1. Reduce `STORM_INTENSITY_MAX` in config.h
2. Reduce `JSON_BUFFER_SIZE`
3. Use ESP32 with PSRAM (ESP32-S3)

## Quick Installation Script

### Arduino IDE (Windows PowerShell)
```powershell
# Install Arduino IDE
winget install ArduinoSA.IDE.stable

# Manual steps still required:
# 1. Add ESP32 board URL
# 2. Install ESP32 board package
# 3. Install ArduinoJson library
```

### PlatformIO (All Platforms)
```bash
# Install PlatformIO
pip install platformio

# Navigate to firmware directory
cd esp32-firmware

# Install dependencies
pio lib install

# Build
pio run

# Upload
pio run -t upload

# Monitor
pio device monitor
```

## Resource Links

- **Arduino IDE**: https://www.arduino.cc/en/software
- **PlatformIO**: https://platformio.org
- **ESP32 Documentation**: https://docs.espressif.com
- **ArduinoJson**: https://arduinojson.org
- **Ghost Protocol Repo**: [Your GitHub URL]

---

**Need Help?** See [ESP32_SETUP.md](ESP32_SETUP.md) for detailed setup instructions.
