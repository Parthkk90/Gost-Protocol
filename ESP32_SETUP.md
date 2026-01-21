# Ghost Protocol - ESP32 Setup Guide

## 🎯 What You Need

### Hardware
- **ESP32 Development Board** (any variant with WiFi)
  - ESP32-DevKitC
  - ESP32-WROOM-32
  - ESP32-S3
  - NodeMCU-32S
  - Or any compatible ESP32 board
- **Micro USB Cable** (for programming and power)
- **Computer** (Windows, macOS, or Linux)

### Software
- **Arduino IDE** (version 2.0 or later) - [Download here](https://www.arduino.cc/en/software)
- **OR PlatformIO** (for advanced users) - [Download here](https://platformio.org/)

---

## 🚀 Quick Start (Arduino IDE)

### Step 1: Install Arduino IDE
1. Download and install Arduino IDE from https://www.arduino.cc/en/software
2. Open Arduino IDE

### Step 2: Add ESP32 Board Support
1. Go to **File → Preferences**
2. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Click **OK**
4. Go to **Tools → Board → Board Manager**
5. Search for "**esp32**"
6. Install "**esp32 by Espressif Systems**"

### Step 3: Install Required Libraries
1. Go to **Tools → Manage Libraries**
2. Install the following libraries:
   - **ArduinoJson** (by Benoit Blanchon) - version 6.x or later
   - **WiFi** (usually pre-installed with ESP32)
   - **HTTPClient** (usually pre-installed with ESP32)
   - **WebServer** (usually pre-installed with ESP32)

### Step 4: Configure WiFi Credentials
1. Open `ghost_protocol_esp32.ino` in Arduino IDE
2. Find these lines at the top:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Replace with your actual WiFi credentials:
   ```cpp
   const char* WIFI_SSID = "MyHomeWiFi";
   const char* WIFI_PASSWORD = "MyPassword123";
   ```

### Step 5: Upload to ESP32
1. Connect your ESP32 to computer via USB
2. In Arduino IDE, go to **Tools → Board** and select your ESP32 board
   - For generic boards, choose "ESP32 Dev Module"
3. Select the correct **Port** under **Tools → Port**
4. Click the **Upload** button (→ arrow icon)
5. Wait for upload to complete

### Step 6: Monitor Serial Output
1. Click **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   =================================================
      Ghost Protocol - ESP32 Edition
      Blockchain Transaction Anonymization
   =================================================
   
   [WIFI] Connecting to MyHomeWiFi
   [OK] WiFi connected!
   [INFO] IP Address: 192.168.1.XXX
   [OK] Web server started
   [INFO] Dashboard available at: http://192.168.1.XXX
   [INFO] Starting mimicry engine...
   ```

### Step 7: Access Web Dashboard
1. Note the IP address from Serial Monitor (e.g., `192.168.1.100`)
2. Open a web browser
3. Go to: `http://192.168.1.100` (use your ESP32's IP)
4. You should see the Ghost Protocol dashboard!

---

## 🎛️ Configuration Options

### Network Selection
Edit `config.h` to choose blockchain network:

```cpp
// Uncomment the network you want
#define NETWORK_SEPOLIA      // Ethereum Sepolia (recommended)
// #define NETWORK_GOERLI    // Ethereum Goerli
// #define NETWORK_MUMBAI    // Polygon Mumbai
// #define NETWORK_BSC_TESTNET  // BSC Testnet
```

### Mimicry Engine Tuning
Adjust in `config.h`:

```cpp
// More frequent heartbeats = better anonymity but more traffic
#define HEARTBEAT_INTERVAL_MIN 5000   // milliseconds
#define HEARTBEAT_INTERVAL_MAX 45000  // milliseconds

// Storm intensity (number of decoys)
#define STORM_INTENSITY_MIN 30
#define STORM_INTENSITY_MAX 80
```

---

## 📊 Using the Web Dashboard

### Dashboard Features
- **Real-time Statistics**: View total decoys, storms, and uptime
- **System Status**: Monitor WiFi signal and memory usage
- **Manual Control**: Trigger decoy storms on-demand
- **Start/Stop Engine**: Control the mimicry engine

### Dashboard Controls
- **🌩️ Trigger Storm**: Manually generate a decoy storm
- **▶️ Start Engine**: Activate the mimicry engine
- **⏸️ Stop Engine**: Pause decoy generation

### Auto-Refresh
The dashboard automatically refreshes every 5 seconds to show live stats.

---

## 🔧 Troubleshooting

### ESP32 Not Connecting to WiFi
**Problem**: Serial Monitor shows "WiFi connection failed"

**Solutions**:
1. Double-check WiFi credentials (SSID and password)
2. Ensure ESP32 is within WiFi range
3. Try 2.4GHz WiFi (ESP32 doesn't support 5GHz)
4. Check if your router has MAC filtering enabled

### Upload Failed / Port Not Found
**Problem**: Arduino IDE can't upload to ESP32

**Solutions**:
1. Install USB-to-Serial drivers:
   - **CP210x**: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
   - **CH340**: http://www.wch-ic.com/downloads/CH341SER_EXE.html
2. Try a different USB cable (some are power-only)
3. Press and hold the "BOOT" button on ESP32 while uploading
4. Restart Arduino IDE and reconnect ESP32

### Can't Access Dashboard
**Problem**: Can't open dashboard in browser

**Solutions**:
1. Check Serial Monitor for the correct IP address
2. Ensure computer and ESP32 are on the same WiFi network
3. Try disabling firewall temporarily
4. Ping the ESP32 IP to verify connection

### Compilation Errors
**Problem**: Code won't compile

**Solutions**:
1. Verify ArduinoJson library is installed (version 6.x)
2. Select correct board: **ESP32 Dev Module**
3. Update ESP32 board package to latest version
4. Clear Arduino cache: Close IDE, delete `C:\Users\[User]\AppData\Local\Temp\arduino_*` folders

### Low Memory Warnings
**Problem**: ESP32 runs out of memory

**Solutions**:
1. Reduce storm intensity in `config.h`
2. Decrease `JSON_BUFFER_SIZE`
3. Use ESP32 with more RAM (e.g., ESP32-S3)

---

## 📈 Performance Optimization

### For Maximum Anonymity
```cpp
#define HEARTBEAT_INTERVAL_MIN 3000   // More frequent
#define HEARTBEAT_INTERVAL_MAX 30000
#define STORM_INTENSITY_MIN 50        // Higher intensity
#define STORM_INTENSITY_MAX 120
```

### For Battery Power / Low Traffic
```cpp
#define HEARTBEAT_INTERVAL_MIN 10000  // Less frequent
#define HEARTBEAT_INTERVAL_MAX 60000
#define STORM_INTENSITY_MIN 20        // Lower intensity
#define STORM_INTENSITY_MAX 50
```

### For Testing
```cpp
#define HEARTBEAT_INTERVAL_MIN 2000   // Very frequent
#define HEARTBEAT_INTERVAL_MAX 10000
#define STORM_PROBABILITY 70          // Storms more often
```

---

## 🔐 Security Considerations

### Production Use
1. **Enable Dashboard Authentication**:
   ```cpp
   #define DASHBOARD_AUTH_ENABLED true
   #define DASHBOARD_USERNAME "admin"
   #define DASHBOARD_PASSWORD "YourStrongPassword"
   ```

2. **Use Private RPC Endpoints**:
   - Sign up for Infura or Alchemy
   - Replace public RPC endpoints with your private ones

3. **Enable SSL Verification**:
   ```cpp
   #define VERIFY_SSL_CERTIFICATES true
   ```

### Network Security
- The ESP32 only makes **outbound** HTTP requests
- No wallet private keys are stored or transmitted
- All RPC calls are **read-only** (eth_call)
- Decoys use random, non-signing operations

---

## 💡 Advanced: PlatformIO Setup

### platformio.ini
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

lib_deps = 
    bblanchon/ArduinoJson@^6.21.0

upload_speed = 921600
monitor_filters = esp32_exception_decoder
```

### Build and Upload
```bash
pio run -t upload
pio device monitor
```

---

## 📝 LED Status Indicators

| LED Pattern | Meaning |
|------------|---------|
| Slow blink (500ms) | Normal operation |
| Rapid blink | Decoy storm in progress |
| Solid on | WiFi connecting |
| Off | Engine stopped |

---

## 🆘 Getting Help

### Serial Monitor Commands
The serial output shows:
- WiFi connection status
- Decoy generation activity (dots)
- Storm triggers
- Statistics every 50 decoys

### Useful Links
- ESP32 Documentation: https://docs.espressif.com/projects/esp-idf/
- Arduino ESP32: https://github.com/espressif/arduino-esp32
- Ghost Protocol Issues: [Your GitHub repo]/issues

---

## 🎉 Success Checklist

- [ ] ESP32 connects to WiFi
- [ ] Serial Monitor shows decoy activity (dots)
- [ ] Dashboard accessible in browser
- [ ] Statistics update in real-time
- [ ] Manual storm button works
- [ ] LED blinks to show activity

---

## 🚀 Next Steps

1. **Run Validation**: Monitor the system for 15-30 minutes
2. **Adjust Settings**: Tune based on your anonymity needs
3. **Integrate with Wallet**: Configure your wallet to route through ESP32 proxy (Phase 2)
4. **Join Relay Network**: Connect to Ghost Protocol relay network (Phase 3)

**Congratulations! Your ESP32 Ghost Protocol node is now active! 👻**
