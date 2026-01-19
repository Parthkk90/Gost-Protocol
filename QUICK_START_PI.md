# Ghost Protocol - Raspberry Pi Quick Start

## Prerequisites
- Raspberry Pi 3 B+ (or newer)
- MicroSD card with Raspberry Pi OS installed
- WiFi/Ethernet connection
- Power supply

## Step-by-Step Setup

### 1. Prepare Your Raspberry Pi

**First time setup:**
```bash
# On your Pi, update everything
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Transfer Code to Raspberry Pi

**Option A: Via Git (Recommended)**
```bash
# On your Raspberry Pi
cd ~
git clone https://github.com/Parthkk90/Gost-Protocol.git gost_protocol
cd gost_protocol
```

**Option B: Via USB/Network Copy**
- Copy your `F:\W3\gost_protocol` folder to Pi's home directory
- Rename to `gost_protocol` if needed

### 3. Run Installation Script

```bash
cd ~/gost_protocol
chmod +x raspberry_pi_install.sh
./raspberry_pi_install.sh
```

This will:
- Install Python 3 and pip
- Install all required packages
- Set up environment
- Test everything works

### 4. Find Your Pi's IP Address

```bash
hostname -I
```

Example output: `192.168.1.100`

### 5. Start the Dashboard

```bash
cd ~/gost_protocol/soft-pni
python3 dashboard.py
```

Visit from **any device** on your network:
- `http://192.168.1.100:5000` (use your actual Pi IP)

### 6. Start the RPC Proxy (Optional)

In a new terminal:
```bash
cd ~/gost_protocol/soft-pni
python3 rpc_proxy.py
```

Configure your wallet to use:
- RPC URL: `http://192.168.1.100:8545`

---

## Quick Commands

**Check if running:**
```bash
ps aux | grep python3
```

**Stop dashboard:**
```bash
# Press Ctrl+C in the terminal
```

**View logs:**
```bash
cd ~/gost_protocol/soft-pni
# Logs appear in terminal
```

---

## What You Can Do Now

✅ **Access dashboard** from phone/laptop on same WiFi  
✅ **Trigger test storms** to see decoy generation  
✅ **Monitor system stats** (CPU, RAM, network)  
✅ **View live activity** feed  
✅ **Use with MetaMask** by pointing to Pi's RPC proxy  

---

## Troubleshooting

**Can't access dashboard from another device?**
```bash
# Check if firewall is blocking
sudo ufw allow 5000
sudo ufw allow 8545
```

**Import errors?**
```bash
# Reinstall dependencies
cd ~/gost_protocol/soft-pni
pip3 install -r requirements.txt --upgrade
```

**Can't find Pi's IP?**
```bash
hostname -I | awk '{print $1}'
# Or check your router's device list
```

---

## Next Steps (Advanced)

After you have it running, you can:

1. **Auto-start on boot** - Set up systemd service
2. **WiFi Hotspot mode** - Pi creates its own network
3. **GPIO LEDs** - Visual indicators
4. **OLED Display** - Show stats on screen
5. **Hardware TRNG** - True random number generation

See `docs/RASPBERRY_PI_SETUP.md` for advanced setup.

---

## Performance on Pi 3 B+

Expected performance:
- Storm generation: 1-2 seconds for 85 decoys
- Memory usage: ~150-200 MB
- CPU usage: 20-40% during storms
- Power consumption: ~4W total
- Can handle 24/7 operation

---

**Need Help?** Check the logs in terminal or visit the Activity page in the dashboard.
