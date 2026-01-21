# Quick ESP32 Setup for Arduino IDE

## Problem: ESP32 board download times out

## Solution: Use smaller, stable version

### Step 1: Configure Arduino IDE
1. Open Arduino IDE
2. **File → Preferences**
3. In "Additional Boards Manager URLs" add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click OK

### Step 2: Install ESP32 Board (Version 2.0.11)
1. **Tools → Board → Boards Manager**
2. Search: **"esp32"**
3. Find **"esp32 by Espressif Systems"**
4. Click the dropdown (shows versions)
5. Select **2.0.11** (much smaller, faster download)
6. Click **Install**
7. Wait 3-5 minutes

### Step 3: If Still Timeout
- Close Arduino IDE
- Delete cache: `C:\Users\skpav\AppData\Local\Arduino15\staging`
- Restart Arduino IDE
- Try install again

### Step 4: Configure Board
1. **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
2. **Tools → Port → COM3** (or your ESP32 port)
3. **Tools → Upload Speed → 115200** (slower but more reliable)

### Step 5: Upload Firmware
1. **File → Open** → `F:\W3\gost_protocol\esp32-pni\pni_core.ino`
2. Click **Upload** (→ button)
3. If stuck on "Connecting...", hold **BOOT** button on ESP32
4. Wait for "Hard resetting via RTS pin..."

### Step 6: Test
1. **Tools → Serial Monitor**
2. Baud: **115200**
3. Press **Reset** button on ESP32
4. Should see: "Ghost Protocol - PNI Core v1.0"

## Alternative: Direct Upload with esptool

If Arduino IDE completely fails, use esptool directly:

```powershell
pip install esptool

# Find your COM port
mode

# Upload (replace COM3 with your port)
python -m esptool --chip esp32 --port COM3 --baud 460800 write_flash -z 0x1000 firmware.bin
```

(You'd need to compile first, which requires Arduino IDE anyway)

## Recommendation

**Just retry Arduino IDE with version 2.0.11** - it's only 250MB vs 500MB+ for newer versions, so timeout is less likely.

The key is selecting the older version (2.0.11) from the dropdown before installing.
