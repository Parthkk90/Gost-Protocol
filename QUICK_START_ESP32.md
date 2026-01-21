# Ghost Protocol ESP32 - Quick Start Guide

## ⚡ 5-Minute Setup

### What You Need
- ESP32 Dev Board ($5-10)
- Micro USB Cable
- Computer with Arduino IDE
- WiFi Network

### Step-by-Step

#### 1. Install Arduino IDE
Download from https://www.arduino.cc/en/software

#### 2. Add ESP32 Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Board Manager**
5. Search "esp32" and install **esp32 by Espressif Systems**

#### 3. Install ArduinoJson Library
1. Go to **Tools → Manage Libraries**
2. Search "ArduinoJson"
3. Install **ArduinoJson by Benoit Blanchon** (version 6.x)

#### 4. Configure WiFi
1. Open `ghost_protocol_esp32.ino`
2. Edit these lines:
   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
3. Replace with your WiFi credentials

#### 5. Upload to ESP32
1. Connect ESP32 via USB
2. Select **Tools → Board → ESP32 Dev Module**
3. Select **Tools → Port** (COM3, COM4, etc. on Windows)
4. Click **Upload** (→ button)
5. Wait for "Done uploading"

#### 6. View Status
1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   [OK] WiFi connected!
   [INFO] IP Address: 192.168.1.XXX
   [INFO] Dashboard available at: http://192.168.1.XXX
   ```

#### 7. Open Dashboard
1. Copy the IP address (e.g., 192.168.1.100)
2. Open browser and go to: `http://192.168.1.100`
3. You should see the Ghost Protocol dashboard!

## 🎉 Done!

Your ESP32 is now:
- ✅ Generating blockchain decoys
- ✅ Rotating across multiple RPC endpoints
- ✅ Running 24/7 anonymization
- ✅ Accessible via web dashboard

## 📊 Monitor Activity

### Serial Monitor
Watch real-time decoy generation:
```
........................................................
=== Ghost Protocol Statistics ===
Total Decoys:     523
Storms Triggered: 8
Uptime:           312 seconds (5 min)
Decoy Rate:       104.6 per minute
=================================
```

### Web Dashboard
Visit `http://[ESP32-IP]` to see:
- Live statistics
- System status
- Manual storm trigger
- Start/stop controls

## 🔧 Configuration

Edit `config.h` to customize:

### More Decoys (Better Anonymity)
```cpp
#define HEARTBEAT_INTERVAL_MIN 3000
#define HEARTBEAT_INTERVAL_MAX 20000
#define STORM_INTENSITY_MAX 120
```

### Less Traffic (Battery/Data Saving)
```cpp
#define HEARTBEAT_INTERVAL_MIN 10000
#define HEARTBEAT_INTERVAL_MAX 60000
#define STORM_INTENSITY_MAX 40
```

### Change Blockchain Network
```cpp
// Uncomment the one you want:
#define NETWORK_SEPOLIA      // Ethereum (recommended)
// #define NETWORK_MUMBAI    // Polygon
// #define NETWORK_BSC_TESTNET  // Binance Smart Chain
```

## 🆘 Troubleshooting

### WiFi Won't Connect
- Check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router

### Can't Find Port
- Install USB drivers:
  - CP210x: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
  - CH340: http://www.wch-ic.com/downloads/CH341SER_EXE.html
- Try different USB cable

### Upload Failed
- Press and hold **BOOT** button while uploading
- Try slower upload speed: **Tools → Upload Speed → 115200**

### Can't Access Dashboard
- Check Serial Monitor for correct IP
- Ensure computer is on same WiFi network
- Try disabling firewall temporarily

## 💡 Next Steps

### 1. Let It Run
- Leave ESP32 powered on 24/7
- Monitor dashboard periodically
- Check statistics after 1 hour

### 2. Optimize Settings
- Adjust storm intensity based on your needs
- Tune heartbeat intervals
- Choose appropriate blockchain network

### 3. Integrate with Wallet (Future)
- Configure MetaMask to use ESP32 as proxy
- Route real transactions through Ghost Protocol
- Achieve full transaction anonymization

## 📈 Understanding the Stats

### Total Decoys
Number of fake blockchain calls generated. Target: 50+ per minute

### Storms Triggered
Burst events with 30-80 rapid decoys. Should occur every 1-2 minutes

### Noise Ratio
Decoys per real transaction. Target: 50:1 or higher

### Uptime
How long ESP32 has been running. Longer = better anonymization

## 🔐 Security Notes

- ESP32 makes **read-only** calls (eth_call)
- No private keys stored or transmitted
- Only outbound HTTPS connections
- Dashboard is HTTP (local network only)

## 🌐 Supported Networks

| Network | Status | Use Case |
|---------|--------|----------|
| Sepolia | ✅ Recommended | Ethereum testing |
| Goerli | ✅ Available | Ethereum (legacy) |
| Mumbai | ✅ Available | Polygon testing |
| BSC Testnet | ✅ Available | BSC testing |

## 📚 More Info

- Full Setup Guide: [ESP32_SETUP.md](ESP32_SETUP.md)
- Requirements: [esp32-firmware/REQUIREMENTS.md](esp32-firmware/REQUIREMENTS.md)
- Main README: [README.md](README.md)

---

**🎊 Congratulations! You're now running Ghost Protocol on ESP32!**

Your blockchain transactions are now protected by hardware-level anonymization. 🛡️👻
