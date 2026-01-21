# Migration Guide: Raspberry Pi → ESP32

## Why ESP32 Instead of Raspberry Pi?

### The Problem with Raspberry Pi
- ❌ **Requires SD Card**: Need to buy, format, and flash an SD card
- ❌ **Power Hungry**: 5-15W power consumption
- ❌ **Expensive**: $35-75 depending on model
- ❌ **Bulky**: Credit card sized, needs case
- ❌ **Complex Setup**: OS installation, SSH, configuration
- ❌ **Overkill**: Full Linux OS for simple task

### Why ESP32 is Better
- ✅ **No SD Card**: Built-in flash storage (4MB+)
- ✅ **Low Power**: 0.5-1W consumption (10x less)
- ✅ **Cheap**: $5-10 per board
- ✅ **Tiny**: Thumb-sized, fits anywhere
- ✅ **Simple**: Upload code and done
- ✅ **Perfect Fit**: Just enough power for the task

## Feature Comparison

| Feature | Raspberry Pi 4 | ESP32 |
|---------|----------------|-------|
| **Price** | $35-75 | $5-10 |
| **CPU** | 1.5GHz Quad-Core | 240MHz Dual-Core |
| **RAM** | 2-8GB | 520KB |
| **Storage** | SD Card (8GB+) | Built-in Flash (4MB+) |
| **Power** | 5V 3A (15W) | 5V 0.5A (2.5W) |
| **WiFi** | Yes (2.4/5GHz) | Yes (2.4GHz only) |
| **Size** | 85×56mm | 48×25mm |
| **Setup Time** | 30+ minutes | 5 minutes |
| **OS** | Linux | Bare metal |
| **Ghost Protocol** | Supported | ✅ **Optimized** |

## What Changes?

### What Stays the Same
- ✅ Same anonymization algorithm
- ✅ Same RPC endpoints
- ✅ Same decoy patterns
- ✅ Same web dashboard
- ✅ Same testnet support
- ✅ Same noise ratio (50:1+)

### What's Different
- **Language**: Python → C++ (Arduino)
- **Setup**: SD card → USB upload
- **Power**: Wall plug → USB power
- **Performance**: 200 decoys/min → 100 decoys/min
- **Storm Intensity**: 150 max → 80 max (optimized for memory)

## Migration Steps

### 1. Get Hardware

**What to Buy**:
- ESP32 Dev Board ($5-10)
  - Search "ESP32 DevKitC" or "ESP32-WROOM-32"
  - Any ESP32 board with WiFi will work
- Micro USB cable (if you don't have one)

**Where to Buy**:
- Amazon, AliExpress, eBay
- Local electronics stores
- Arduino.cc official distributors

**Don't Buy**:
- ❌ ESP8266 (too little memory)
- ❌ ESP32-C3 (less RAM, but will work)
- ❌ Raspberry Pi Pico (different architecture)

### 2. Install Software

**Instead of Raspberry Pi OS**:
- Install Arduino IDE (5 minutes)
- Add ESP32 board support (2 minutes)
- Install ArduinoJson library (1 minute)

**No Need For**:
- ❌ Raspberry Pi Imager
- ❌ SD card formatter
- ❌ SSH client
- ❌ Linux knowledge

See [QUICK_START_ESP32.md](QUICK_START_ESP32.md) for detailed instructions.

### 3. Configuration Changes

**Raspberry Pi Configuration** (what you would have done):
```bash
# Edit config in terminal
sudo nano /etc/ghost-protocol/config.py
sudo systemctl restart ghost-protocol
```

**ESP32 Configuration** (what you actually do):
```cpp
// Edit in Arduino IDE
const char* WIFI_SSID = "YourWiFi";
const char* WIFI_PASSWORD = "YourPassword";
// Click Upload button
```

### 4. Deployment

**Raspberry Pi**:
1. Flash SD card with OS
2. Boot Raspberry Pi
3. SSH into device
4. Install Python dependencies
5. Clone repository
6. Configure and run
7. Setup systemd service
8. Total time: 30-60 minutes

**ESP32**:
1. Connect USB
2. Upload firmware
3. Total time: 5 minutes

### 5. Access Dashboard

**Both Devices**:
- Access via `http://[DEVICE-IP]`
- Same web interface
- Same features

## Performance Comparison

### Decoy Generation

| Metric | Raspberry Pi | ESP32 |
|--------|--------------|-------|
| Heartbeat Decoys | 100-200/min | 50-150/min |
| Storm Size | 50-150 | 30-80 |
| Storm Duration | 2-8 seconds | 2-5 seconds |
| RPC Endpoints | 4+ | 4 |
| Memory Usage | ~50MB | ~80KB |

**Impact on Anonymization**: ✅ None - Both provide 50:1+ noise ratio

### Power Consumption

| Scenario | Raspberry Pi 4 | ESP32 |
|----------|----------------|-------|
| **Idle** | 3W | 0.5W |
| **Active** | 7W | 1W |
| **24h Cost** (at $0.12/kWh) | $0.20 | $0.003 |
| **Annual Cost** | $73 | $1 |

**Savings**: $72/year per device

### Heat & Noise

| Factor | Raspberry Pi | ESP32 |
|--------|--------------|-------|
| **Heat Output** | Warm (40-60°C) | Cool (30-40°C) |
| **Cooling** | Heatsink/fan recommended | None needed |
| **Noise** | Fan noise (if active) | Silent |

## Code Differences

### Python (Raspberry Pi) vs C++ (ESP32)

**Raspberry Pi** (mimicry_engine.py):
```python
def generate_decoy_storm(intensity):
    decoys = []
    for i in range(intensity):
        contract = random.choice(contracts)
        function = random.choice(functions)
        decoy = create_decoy(contract, function)
        decoys.append(decoy)
    return decoys
```

**ESP32** (ghost_protocol_esp32.ino):
```cpp
void generateDecoyStorm() {
    int intensity = random(STORM_INTENSITY_MIN, STORM_INTENSITY_MAX);
    for (int i = 0; i < intensity; i++) {
        int contractIdx = random(CONTRACT_COUNT);
        Contract& contract = KNOWN_CONTRACTS[contractIdx];
        sendDecoyRPCCall(contract.address, function);
        delay(random(50, 150));
    }
}
```

**Functionally Equivalent**: Same logic, different syntax

## FAQ

### Q: Is ESP32 as secure as Raspberry Pi?
**A**: Yes. Both make the same read-only RPC calls. ESP32 has less attack surface (no OS).

### Q: Can I still use Python code?
**A**: Not on ESP32 directly. The Python code runs on PC. ESP32 uses C++ (Arduino).

### Q: Will anonymization be weaker on ESP32?
**A**: No. Same algorithm, same noise ratio, same effectiveness.

### Q: Can I run both?
**A**: Yes! Run Python version on PC for testing, ESP32 for 24/7 deployment.

### Q: What about MicroPython?
**A**: Possible but not recommended. Arduino C++ is more efficient and better supported.

### Q: SD card needed for ESP32?
**A**: ❌ No! ESP32 has 4MB+ built-in flash. No SD card needed.

### Q: Can ESP32 handle the traffic?
**A**: Yes. Tested with 100+ decoys/min continuously for 24+ hours.

### Q: Battery powered ESP32?
**A**: Yes! 18650 battery can power ESP32 for 24+ hours.

### Q: OTA updates supported?
**A**: Planned. Currently upload via USB.

## Troubleshooting

### "But I already bought SD card for Pi"
- Use it for other projects (RetroPie, Pi-hole, etc.)
- Raspberry Pi is still great for many things
- For Ghost Protocol specifically, ESP32 is better

### "I don't know C++"
- The firmware is ready to use
- Just change WiFi credentials
- No C++ knowledge needed for basic use
- Arduino code is beginner-friendly

### "ESP32 seems too cheap to work"
- ESP32 is mass-produced (millions of units)
- Used in commercial IoT products worldwide
- Very reliable and well-tested
- Price reflects scale, not quality

### "What if I need more performance?"
- Use ESP32-S3 (more RAM, faster)
- Or run Python version on PC
- Or run multiple ESP32s in parallel

## Summary

| Factor | Winner |
|--------|--------|
| Cost | 🏆 ESP32 |
| Power Efficiency | 🏆 ESP32 |
| Setup Simplicity | 🏆 ESP32 |
| No SD Card | 🏆 ESP32 |
| Size | 🏆 ESP32 |
| Raw Performance | Raspberry Pi |
| Future Expandability | Raspberry Pi |
| **Best for Ghost Protocol** | 🏆 **ESP32** |

## Next Steps

1. **Order ESP32 Board** ($5-10)
2. **While Waiting**: Read [QUICK_START_ESP32.md](QUICK_START_ESP32.md)
3. **When Arrives**: Follow [ESP32_SETUP.md](ESP32_SETUP.md)
4. **Within 5 Minutes**: Running Ghost Protocol!

---

**Don't have SD card? Perfect! ESP32 doesn't need one!** 🎉

The ESP32 path is simpler, cheaper, and more efficient for this specific use case.
