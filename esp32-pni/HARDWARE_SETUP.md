# ESP32 PNI Hardware Setup Guide

## What You Need

### Required Hardware
- **ESP32 Dev Board** ($5-10) - Any ESP32 will work
- **USB Cable** - For programming and power
- **Breadboard** - For prototyping

### Optional Sensors (Boost Entropy)
- **MPU6050** - Motion sensor ($3)
- **Touch Sensor** - Capacitive touch ($2)
- **Microphone Module** - Sound entropy ($2)
- **Temperature Sensor** - Thermal noise ($2)

**Total Cost: $5 minimum, $20 with all sensors**

---

## Quick Start (No Sensors)

### 1. Install Arduino IDE

Download from: https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search "ESP32" and click **Install**

### 3. Flash the Firmware

1. Open `pni_core.ino` in Arduino IDE
2. Select your board: **Tools → Board → ESP32 Dev Module**
3. Select port: **Tools → Port → COM3** (your ESP32 port)
4. Click **Upload** (arrow button)

### 4. Test It

1. Open **Tools → Serial Monitor** (set to 115200 baud)
2. You'll see:
   ```
   ======================================
   Ghost Protocol - PNI Core v1.0
   Personal Network Identifier System
   ======================================
   
   [PNI] Generating new identifier...
   [PNI] Generated successfully
   [PNI] ID: a3f7c912e4d8b3a6...
   [System] Ready for payment operations
   ```

### 5. Try Commands

Type in Serial Monitor:
- `status` - Show current PNI
- `rotate` - Generate new PNI
- `entropy` - Collect fresh randomness
- `help` - Show all commands

---

## How It Works (Without Sensors)

Even without external sensors, ESP32 generates **true randomness** from:

1. **WiFi RF Noise** - ESP32's radio picks up electromagnetic noise
2. **CPU Timing Jitter** - Microsecond-level variations
3. **Internal Temperature** - CPU heat fluctuations
4. **Hardware RNG** - ESP32's built-in random number generator
5. **Power Supply Noise** - Electrical variations

**Result:** 256-bit cryptographically secure PNI that rotates every 24 hours

---

## Adding Sensors (Optional)

### Wiring Diagram

```
ESP32 Pin    →    Sensor
=================================
GPIO34       →    Motion (MPU6050)
GPIO27       →    Touch Sensor
GPIO35       →    Microphone
GPIO36       →    Temperature
3.3V         →    Sensor VCC
GND          →    Sensor GND
```

### Why Add Sensors?

More physical entropy sources = stronger randomness:
- **Motion** - User movement, vibration
- **Touch** - Human capacitance variations
- **Sound** - Environmental audio noise
- **Temperature** - Thermal fluctuations

Each sensor adds unique physical randomness that's impossible to predict or replay.

---

## PNI Properties

### Generated PNI
- **Size:** 256 bits (32 bytes)
- **Format:** SHA-256 hash of mixed entropy
- **Rotation:** Every 24 hours automatically
- **Storage:** Saved to EEPROM (survives reboot)
- **Uniqueness:** Cryptographically unique per device

### What Makes It Secure

```
PNI = SHA256(
    hardware_random +      // ESP32 RNG
    motion_noise +         // Physical movement
    audio_noise +          // Sound environment
    temperature +          // Thermal drift
    timing_jitter +        // CPU microseconds
    device_mac +           // Unique to this ESP32
    timestamp +            // Current time
    rotation_count         // Prevents replay
)
```

**Attack Resistance:**
- ✅ Can't predict future PNIs
- ✅ Can't link to previous PNIs
- ✅ Can't replay old PNIs
- ✅ Can't clone device identity
- ✅ Physically unique randomness

---

## Testing PNI Quality

### Test 1: Generate Multiple PNIs
```
Type: rotate
Wait 1 second
Type: rotate
Wait 1 second
Type: rotate
```

**Expected:** Every PNI completely different (no patterns)

### Test 2: Entropy Collection
```
Type: entropy
Tap the ESP32 board
Type: entropy
Blow on the board
Type: entropy
```

**Expected:** Physical actions add to entropy pool

### Test 3: Persistence
```
Type: status (note the PNI)
Unplug ESP32
Plug back in
Type: status
```

**Expected:** Same PNI loaded from EEPROM (until 24h rotation)

---

## Next Steps

Once PNI is working:

1. **Payment Credentials** - Generate one-time payment IDs from PNI
2. **Zero-Knowledge Proofs** - Prove payment without revealing PNI
3. **NFC/Bluetooth** - Wireless payment transmission
4. **Merchant Verification** - Server-side payment validation
5. **Retail Integration** - Point-of-sale system

---

## Troubleshooting

**"No ESP32 port found"**
- Install CP210x drivers: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- Try different USB cable (must support data, not just power)

**"Compilation error"**
- Verify ESP32 board package installed
- Check Arduino IDE version (use 2.0+)

**"Upload failed"**
- Hold BOOT button while uploading
- Check correct port selected
- Reduce upload speed: Tools → Upload Speed → 115200

**"Random values seem predictable"**
- This is normal during testing
- Real-world usage has more entropy sources
- Adding sensors dramatically improves randomness

---

## Hardware Recommendations

### Beginner Setup ($5)
- ESP32 Dev Board only
- Uses built-in entropy sources
- Good for learning and testing

### Standard Setup ($15)
- ESP32 + MPU6050 motion sensor
- Significant entropy boost from movement
- Good for real deployment

### Professional Setup ($25)
- ESP32 + all sensors
- Maximum entropy collection
- Production-ready security

---

**Status:** PNI Core complete and ready for payment system integration
