# Ghost Protocol - ESP32 Firmware

## 📦 What's Included

This directory contains the complete ESP32 firmware for running Ghost Protocol on hardware.

### Files

- **`ghost_protocol_esp32.ino`** - Main firmware file (Arduino sketch)
- **`config.h`** - Configuration header (WiFi, network selection, tuning)
- **`platformio.ini`** - PlatformIO project configuration
- **`library.json`** - Library metadata for PlatformIO
- **`REQUIREMENTS.md`** - Detailed requirements and compatibility info

## 🚀 Quick Start

### Arduino IDE (Recommended for Beginners)
1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board support
3. Install ArduinoJson library
4. Edit WiFi credentials in `ghost_protocol_esp32.ino`
5. Upload to ESP32

See [../QUICK_START_ESP32.md](../QUICK_START_ESP32.md) for step-by-step guide.

### PlatformIO (Advanced Users)
```bash
# Install PlatformIO
pip install platformio

# Build and upload
pio run -t upload

# Monitor serial output
pio device monitor
```

## ⚙️ Configuration

Edit `config.h` or directly in `ghost_protocol_esp32.ino`:

### WiFi Settings
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

### Network Selection
```cpp
// Choose your blockchain network:
#define NETWORK_SEPOLIA      // Ethereum Sepolia (default)
// #define NETWORK_MUMBAI    // Polygon Mumbai
// #define NETWORK_BSC_TESTNET  // BSC Testnet
```

### Anonymization Tuning
```cpp
#define HEARTBEAT_INTERVAL_MIN 5000   // Heartbeat frequency
#define HEARTBEAT_INTERVAL_MAX 45000
#define STORM_INTENSITY_MIN 30        // Decoys per storm
#define STORM_INTENSITY_MAX 80
```

## 🔌 Hardware Requirements

### Minimum
- **ESP32 Dev Board** (any variant with WiFi)
- **USB cable** for power and programming
- **WiFi network** (2.4GHz)

### Recommended
- ESP32-DevKitC or ESP32-WROOM-32
- ESP32-S3 for better performance (has PSRAM)
- Stable 5V 1A power supply for deployment

### Not Compatible
- ❌ ESP8266 (insufficient memory)
- ❌ 5GHz-only WiFi networks

## 📊 Features

### Core Functionality
- ✅ Real-time decoy generation
- ✅ Multi-RPC endpoint rotation
- ✅ Realistic DeFi interaction patterns
- ✅ Configurable storm intensity
- ✅ 24/7 heartbeat operation

### Web Dashboard
- ✅ Live statistics display
- ✅ Manual storm trigger
- ✅ Start/stop controls
- ✅ System status monitoring
- ✅ Auto-refresh every 5 seconds

### Smart Decoys
- ✅ DEX operations (Uniswap, etc.)
- ✅ Lending protocols (Aave, etc.)
- ✅ Token operations (ERC20)
- ✅ Stratified sampling across categories

## 🌐 Web Dashboard

After uploading, access the dashboard:

1. Open Serial Monitor (115200 baud)
2. Note the IP address (e.g., `192.168.1.100`)
3. Open browser: `http://192.168.1.100`

Dashboard shows:
- Total decoys generated
- Storms triggered
- System uptime
- WiFi signal strength
- Free memory
- Manual controls

## 🔧 Troubleshooting

### Compilation Errors

**Error**: `ArduinoJson.h: No such file`
- **Fix**: Install ArduinoJson library via Library Manager

**Error**: `WiFi.h: No such file`
- **Fix**: Install/update ESP32 board package

### Upload Issues

**Error**: `Serial port not found`
- **Fix**: Install USB-to-Serial drivers (CP210x or CH340)

**Error**: `Failed to connect to ESP32`
- **Fix**: Hold BOOT button while clicking Upload

### Runtime Issues

**WiFi won't connect**
- Check SSID and password (case-sensitive)
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Move closer to router

**Dashboard not accessible**
- Verify IP address in Serial Monitor
- Ensure computer on same WiFi network
- Try disabling firewall

**Out of memory errors**
- Reduce `STORM_INTENSITY_MAX` in config
- Use ESP32 with more RAM (ESP32-S3)

## 📈 Performance

### Typical Stats (ESP32-DevKitC)
- Decoy rate: 50-150 per minute
- Storm generation: 30-80 decoys in 2-5 seconds
- Memory usage: ~80KB RAM
- Power consumption: ~200mA active, ~50mA idle

### Optimization Tips

**For Maximum Anonymity**
```cpp
#define HEARTBEAT_INTERVAL_MIN 3000
#define STORM_INTENSITY_MAX 120
#define STORM_PROBABILITY 50
```

**For Battery/Low Power**
```cpp
#define HEARTBEAT_INTERVAL_MIN 15000
#define STORM_INTENSITY_MAX 40
#define STORM_PROBABILITY 20
```

## 🔐 Security Considerations

### What's Safe
- ✅ All RPC calls are **read-only** (eth_call)
- ✅ No private keys stored or transmitted
- ✅ Only outbound HTTPS connections
- ✅ Decoys are indistinguishable from queries

### Limitations
- ⚠️ Dashboard uses HTTP (local network only)
- ⚠️ WiFi credentials stored in flash
- ⚠️ No SSL certificate verification (by default)

### For Production
1. Enable dashboard authentication in config
2. Use private RPC endpoints
3. Enable SSL verification
4. Deploy in secure network

## 🆕 Updates

### Version 1.0 (Current)
- Initial ESP32 firmware release
- Web dashboard
- Multi-network support
- Configurable parameters

### Planned
- OTA (Over-The-Air) updates
- MQTT integration
- Hardware random number generator
- Secure boot support

## 📚 Documentation

- **Quick Start**: [../QUICK_START_ESP32.md](../QUICK_START_ESP32.md)
- **Full Setup Guide**: [../ESP32_SETUP.md](../ESP32_SETUP.md)
- **Requirements**: [REQUIREMENTS.md](REQUIREMENTS.md)
- **Main Project**: [../README.md](../README.md)

## 🤝 Contributing

Found a bug or have an improvement?
1. Test on your ESP32 board
2. Document hardware specs
3. Submit pull request or issue

## 📄 License

Same as main Ghost Protocol project - see [../LICENSE](../LICENSE)

## 🆘 Support

- **Setup Issues**: See [../ESP32_SETUP.md](../ESP32_SETUP.md)
- **Hardware Problems**: See [REQUIREMENTS.md](REQUIREMENTS.md)
- **Project Questions**: See [../README.md](../README.md)

---

**Ready to get started?** See [../QUICK_START_ESP32.md](../QUICK_START_ESP32.md) for complete setup instructions! 🚀
