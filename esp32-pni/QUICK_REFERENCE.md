# ESP32 PNI Quick Reference Card

## Arduino IDE Setup (30 seconds)
```
1. File → Preferences → Additional Board Manager URLs
   Add: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

2. Tools → Board → Boards Manager
   Search: ESP32
   Install: esp32 by Espressif Systems

3. Tools → Board → ESP32 Dev Module
4. Tools → Port → [Your ESP32 port]
```

## Flash Firmware (1 minute)
```
1. Open: esp32-pni/pni_core.ino
2. Click Upload (→ button)
3. Wait for "Hard resetting via RTS pin..."
4. Done!
```

## Serial Commands
```
status   - Show current PNI ID, age, rotation count
rotate   - Force generate new PNI (don't wait 24h)
entropy  - Collect fresh physical randomness
help     - Show all commands
```

## Expected Serial Output
```
======================================
Ghost Protocol - PNI Core v1.0
Personal Noise Injector System
======================================

[HW-Entropy] Initialized all entropy sources
[PNI] Generating new identifier...
[PNI] Generated successfully
[PNI] ID: a3f7c912e4d8b3a62f1a5e9d8c7b4a31...
[PNI] Age: 0 ms
[PNI] Rotation: #1

[System] Ready for payment operations
```

## Quick Tests

### Test 1: Generate PNI
```
Reset ESP32 → Should auto-generate PNI
Expected: 64-character hex ID
```

### Test 2: Persistence
```
1. Type: status (note PNI)
2. Unplug ESP32
3. Plug back in
4. Type: status
Expected: Same PNI
```

### Test 3: Rotation
```
1. Type: rotate
2. Type: status
Expected: Completely different PNI
```

### Test 4: Uniqueness
```
Type: rotate (3 times)
Expected: All 3 PNIs different
```

## Python Validator (Optional)
```
pip install pyserial
python validate_pni.py
```
Auto-monitors ESP32 and validates PNI quality

## Pinout (Optional Sensors)

```
ESP32 Pin → Sensor
===================
GPIO34    → Motion (MPU6050 SDA)
GPIO27    → Touch sensor
GPIO35    → Microphone
GPIO36    → Temperature
3.3V      → Sensor VCC
GND       → Sensor GND
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No port found | Install CP210x drivers |
| Upload fails | Hold BOOT button |
| Garbled output | Check baud = 115200 |
| PNI not saved | Check board = ESP32 Dev Module |

## What's Next

✅ Phase 1: PNI Core (current)
⏳ Phase 2: Payment credentials
⏳ Phase 3: Zero-knowledge proofs
⏳ Phase 4: BLE/NFC communication
⏳ Phase 5: Merchant integration

## Resources

- **Full Guide:** TESTING_GUIDE.md
- **Architecture:** PNI_ARCHITECTURE.md
- **Hardware:** HARDWARE_SETUP.md
- **Firmware:** pni_core.ino

---

**Start here:** Flash the firmware, open Serial Monitor (115200 baud), press reset!
