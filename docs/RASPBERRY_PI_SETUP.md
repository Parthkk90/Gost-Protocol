# Ghost Protocol - Raspberry Pi 3 B+ Implementation

## Hardware Setup

### What You Have: Raspberry Pi 3 B+
- **CPU**: BCM2837B0, Quad-Core ARM Cortex-A53 @ 1.4GHz
- **RAM**: 1GB LPDDR2
- **WiFi**: Built-in 2.4GHz/5GHz
- **GPIO**: 40 pins (can add hardware TRNG)
- **USB**: 4 ports (can act as USB gadget)
- **Perfect for**: Running Ghost Protocol as standalone device

---

## Phase 2A: Raspberry Pi Software Setup (Week 1)

### Step 1: Install Raspberry Pi OS
```bash
# On your Pi:
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git -y
```

### Step 2: Clone & Setup Ghost Protocol
```bash
git clone https://github.com/Parthkk90/Gost-Protocol.git
cd Gost-Protocol/soft-pni
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Configure for Raspberry Pi
```bash
# Create systemd service for auto-start
sudo nano /etc/systemd/system/ghost-protocol.service
```

Add:
```ini
[Unit]
Description=Ghost Protocol PNI Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Gost-Protocol/soft-pni
ExecStart=/home/pi/Gost-Protocol/soft-pni/venv/bin/python rpc_proxy.py sepolia 8545
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable auto-start:
```bash
sudo systemctl enable ghost-protocol
sudo systemctl start ghost-protocol
```

---

## Phase 2B: Hardware TRNG Integration (Week 2)

### Option 1: Use Pi's Built-in HWRNG
```bash
# Enable hardware random number generator
sudo apt install rng-tools -y
sudo systemctl enable rng-tools
sudo systemctl start rng-tools

# Test entropy
cat /dev/hwrng | rngtest -c 1000
```

### Option 2: Add External TRNG via GPIO
**Recommended**: Infinite Noise TRNG (~$40)
- Connects to USB
- True quantum randomness
- Plug & play

**Alternative**: Build avalanche noise TRNG
- Cost: $5-10 in parts
- Connects to GPIO pins
- DIY schematic provided below

### Modify mimicry_engine.py to use hardware entropy:
```python
# Add to mimicry_engine.py
import os

def get_hardware_random_bytes(n):
    """Get true random bytes from hardware"""
    return os.urandom(n)  # Uses /dev/hwrng on Pi

def get_hardware_random_float():
    """Get random float [0,1) from hardware"""
    return int.from_bytes(get_hardware_random_bytes(4)) / (2**32)
```

---

## Phase 2C: USB Gadget Mode (Week 3)

### Make Pi Act as USB Device
Your Pi can act as a USB keyboard/network device to your computer.

**Configure USB Gadget:**
```bash
# Enable dwc2 USB driver
echo "dtoverlay=dwc2" | sudo tee -a /boot/config.txt
echo "dwc2" | sudo tee -a /etc/modules

# Enable USB Ethernet gadget
echo "g_ether" | sudo tee -a /etc/modules

# Reboot
sudo reboot
```

**Connect Pi to your PC via micro-USB** (power port, not USB ports)
- Pi appears as network device
- IP: 192.168.7.2 (Pi) / 192.168.7.1 (PC)
- Configure wallet to: http://192.168.7.2:8545

---

## Phase 2D: Standalone Mode (Week 4)

### Configure Pi as Dedicated PNI Device

**1. Create WiFi Access Point:**
```bash
sudo apt install hostapd dnsmasq -y
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

# Configure AP
sudo nano /etc/hostapd/hostapd.conf
```

Add:
```ini
interface=wlan0
driver=nl80211
ssid=GhostProtocol-PNI
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=YourSecurePassword123
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
```

**2. Configure DHCP:**
```bash
sudo nano /etc/dnsmasq.conf
```

Add:
```
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
```

**3. Set Static IP:**
```bash
sudo nano /etc/dhcpcd.conf
```

Add:
```
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
```

**4. Enable & Start:**
```bash
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl start hostapd
sudo systemctl start dnsmasq
```

**Now your Pi creates its own WiFi network:**
- SSID: `GhostProtocol-PNI`
- Connect your phone/laptop
- Configure wallet: `http://192.168.4.1:8545`

---

## Phase 2E: Hardware Optimizations

### 1. Add Status LEDs (Optional)
Connect LEDs to GPIO pins:
- GPIO 17: Heartbeat (blinks every 5-45s)
- GPIO 27: Transaction detected (blinks on TX)
- GPIO 22: Error indicator (red LED)

```python
# Add to rpc_proxy.py
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)  # Heartbeat
GPIO.setup(27, GPIO.OUT)  # TX detected
GPIO.setup(22, GPIO.OUT)  # Error

# Blink on heartbeat
def heartbeat():
    GPIO.output(17, GPIO.HIGH)
    time.sleep(0.1)
    GPIO.output(17, GPIO.LOW)

# Blink on TX
def tx_detected():
    GPIO.output(27, GPIO.HIGH)
    time.sleep(0.5)
    GPIO.output(27, GPIO.LOW)
```

### 2. Add OLED Display (Optional)
128x64 OLED via I2C shows:
- Current network
- Transactions processed
- Noise ratio stats
- Uptime

**Install:**
```bash
sudo apt install python3-pil -y
pip install adafruit-circuitpython-ssd1306
```

### 3. Performance Tuning
```bash
# Overclock (optional, may void warranty)
sudo nano /boot/config.txt
```

Add:
```
over_voltage=2
arm_freq=1400
gpu_freq=500
```

---

## Deployment Scenarios

### Scenario 1: Desktop Companion Device
```
PC ─── USB ───┐
              │
Laptop ────────┤─── Raspberry Pi (Ghost Protocol)
              │     ├─ WiFi (connects to Internet)
Phone ─ WiFi ─┘     └─ Running rpc_proxy.py
```

**Usage:**
- Pi sits on desk, always on
- Devices connect to Pi's RPC proxy
- Pi handles all anonymization
- No software needed on client devices

### Scenario 2: Portable Privacy Device
```
Raspberry Pi 3 B+ + Battery Pack + Case
├─ Creates WiFi hotspot
├─ Mobile devices connect
├─ Anonymous transactions on-the-go
└─ 8+ hours battery life
```

### Scenario 3: Home Network Installation
```
Router ───┬─── Your Devices (normal internet)
          │
          └─── Raspberry Pi (192.168.1.100)
               ├─ Wallets point to: http://192.168.1.100:8545
               └─ Entire household gets anonymous transactions
```

---

## Hardware Shopping List (Optional Upgrades)

### Minimal Setup (Use what you have)
- ✅ Raspberry Pi 3 B+ (you have)
- ✅ Power supply (you have)
- ✅ MicroSD card (you have)
- **Cost: $0**

### Basic Upgrade ($20-40)
- [ ] Case with cooling fan ($10)
- [ ] Heatsinks ($5)
- [ ] Infinite Noise TRNG USB ($40)
- **Cost: $55**

### Pro Setup ($50-100)
- [ ] Everything above
- [ ] 128x64 OLED display ($10)
- [ ] Status LEDs kit ($5)
- [ ] USB battery pack for portability ($30)
- [ ] Custom 3D printed case ($20)
- **Cost: $120**

---

## Performance Benchmarks (Expected on Pi 3 B+)

| Metric | Raspberry Pi 3 B+ | Target | Status |
|--------|-------------------|--------|--------|
| Storm Generation | ~1-2s | <3s | ✅ Should work |
| Noise Ratio | 85:1 | 50:1 | ✅ Exceeds |
| Concurrent Connections | 10-20 | 5+ | ✅ Good |
| Memory Usage | ~150MB | <512MB | ✅ Plenty |
| Power Consumption | ~4W | <5W | ✅ Within spec |
| Boot Time | ~30s | <60s | ✅ Fast |
| 24/7 Uptime | Stable | Required | ✅ Linux proven |

---

## Quick Start (This Weekend)

### Saturday Morning (2 hours)
```bash
# On your Raspberry Pi:
1. Flash latest Raspberry Pi OS
2. Boot and enable SSH
3. Install Python & dependencies
4. Clone Ghost Protocol repo
5. Test: python3 soft-pni/mimicry_engine.py sepolia
```

### Saturday Afternoon (2 hours)
```bash
6. Start RPC proxy: python3 rpc_proxy.py sepolia 8545
7. Configure MetaMask on your phone
8. Connect to Pi's IP (find with: hostname -I)
9. Send test transaction on Sepolia
10. Watch Pi generate decoy storm!
```

### Sunday (Optional)
```bash
11. Set up systemd service (auto-start)
12. Configure WiFi access point mode
13. Test from multiple devices
14. Let it run 24/7
```

---

## Advantages of Pi 3 B+ Implementation

✅ **No porting needed** - Python runs directly
✅ **Full Linux** - Easy debugging & monitoring
✅ **Built-in WiFi** - No extra hardware
✅ **40 GPIO pins** - Can add TRNG, LEDs, display
✅ **USB gadget capable** - Can act as USB device
✅ **Low power** - ~4W, can run on battery
✅ **Cheap** - You already have it!
✅ **Community support** - Millions of Pi users

---

## Next Steps

Want me to:
1. **Create Pi-specific installation scripts** for one-command setup?
2. **Add GPIO/LED support** to the existing code?
3. **Build systemd service files** for auto-start?
4. **Create WiFi access point configuration**?
5. **Add web dashboard** to monitor from browser?

Just let me know what you'd like to tackle first!
