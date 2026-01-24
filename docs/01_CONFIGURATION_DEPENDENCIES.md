# Ghost Protocol - Configuration & Dependencies Guide

## 🎯 Overview

This document outlines all configuration steps, dependencies, and setup requirements for the Ghost Protocol privacy payment system. The system consists of ESP32 hardware, Solana blockchain integration, relayer service, and client applications.

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │ ── │   ESP32 PNI     │ ── │    Relayer      │ ── │ Solana Blockchain│
│  (Python CLI)   │    │   (Hardware)    │    │  (Bridge)       │    │   (Smart Contract)│
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📦 Dependencies & Requirements

### ESP32 Hardware Dependencies

**Required Libraries:**
```cpp
#include <WiFi.h>               // ESP32 WiFi connectivity
#include <WebServer.h>          // HTTP API server
#include <HTTPClient.h>         // HTTP requests for mimicry
#include <ArduinoJson.h>        // JSON parsing/generation
#include <mbedtls/sha256.h>     // Cryptographic hashing
#include <esp_random.h>         // Hardware random number generator
#include <time.h>               // NTP time synchronization
#include <EEPROM.h>             // Persistent storage
```

**Hardware Configuration:**
- **Board**: ESP32-D0WD-V3 or compatible
- **Flash Size**: 4MB minimum
- **RAM**: 520KB (sufficient for our application)
- **WiFi**: 802.11 b/g/n support required
- **Sensors**: Built-in temperature, RNG, timing circuits

**Pin Configuration:**
```cpp
// No external pins required - uses internal sensors only
// WiFi: Built-in antenna
// Power: USB or 3.3V external supply
// Serial: GPIO1 (TX), GPIO3 (RX)
```

### Python Client Dependencies

**Requirements File (`requirements.txt`):**
```txt
solders==0.26.0              # Solana transaction construction
solana==0.36.6               # Solana blockchain interaction  
base58==2.1.1                # Base58 encoding/decoding
requests==2.31.0             # HTTP requests to ESP32/relayer
argparse==1.4.0              # Command line argument parsing
json==2.0.9                  # JSON data handling
time                         # Built-in timing functions
```

**Installation Commands:**
```bash
pip install solders==0.26.0
pip install solana==0.36.6
pip install base58==2.1.1
pip install requests==2.31.0
```

### Relayer Service Dependencies

**Python Requirements:**
```txt
flask==3.0.0                 # HTTP API server
solders==0.26.0              # Solana transaction signing
solana==0.36.6               # RPC communication
base58==2.1.1                # Address encoding
requests==2.31.0             # ESP32 communication
json                         # JSON processing
logging                      # Error tracking
threading                   # Concurrent request handling
```

**System Requirements:**
- **Python**: 3.8+ (tested on 3.11)
- **OS**: Windows/Linux/macOS
- **Network**: Internet access for Solana RPC
- **Memory**: 256MB minimum

### Solana Program Dependencies

**Rust Toolchain:**
```toml
[dependencies]
anchor-lang = "0.29.0"        # Anchor framework
anchor-spl = "0.29.0"         # SPL token integration
spl-token = "4.0.0"           # Token program interface
solana-program = "1.17.0"    # Core Solana SDK
```

**Build Tools:**
```bash
# Anchor CLI
npm install -g @coral-xyz/anchor-cli@0.29.0

# Solana CLI  
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Rust toolchain
rustup update
rustup component add rustfmt
rustup target add bpf-unknown-unknown
```

---

## ⚙️ Configuration Files

### ESP32 Configuration (`config.h`)

```cpp
// WiFi Configuration
const char* WIFI_SSID = "Your_Network_Name";
const char* WIFI_PASSWORD = "your_password";

// Solana RPC Endpoints (Devnet)
const char* SOLANA_RPC_ENDPOINTS[] = {
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet", 
  "https://solana-devnet.g.alchemy.com/v2/demo"
};

// PNI Configuration
#define PNI_SIZE 32                    // 256-bit identifier
#define ROTATION_INTERVAL 86400000     // 24 hours in milliseconds
#define EEPROM_SIZE 512                // Persistent storage size

// Mimicry Engine Settings
#define HEARTBEAT_MIN 8000             // Minimum interval (8s)
#define HEARTBEAT_MAX 30000            // Maximum interval (30s)
#define STORM_INTENSITY_MIN 20         // Minimum decoys per storm
#define STORM_INTENSITY_MAX 35         // Maximum decoys per storm
```

### Client Configuration (`config.py`)

```python
# Default configuration
DEFAULT_CONFIG = {
    'esp32_ip': '192.168.1.6',
    'esp32_port': 80,
    'relayer_url': 'http://localhost:5000',
    'solana_cluster': 'devnet',
    'timeout': 30,
    'retry_attempts': 3
}

# Solana RPC endpoints
SOLANA_ENDPOINTS = {
    'devnet': 'https://api.devnet.solana.com',
    'mainnet': 'https://api.mainnet-beta.solana.com'
}
```

### Relayer Configuration

```python
# Flask server settings
HOST = '0.0.0.0'
PORT = 5000
DEBUG = False

# Solana configuration
SOLANA_RPC_URL = 'https://api.devnet.solana.com'
COMMITMENT_LEVEL = 'confirmed'

# ESP32 integration
ESP32_TIMEOUT = 10
MAX_RETRY_ATTEMPTS = 3

# Logging configuration
LOG_LEVEL = 'INFO'
LOG_FILE = 'relayer.log'
```

---

## 🔧 Environment Setup

### ESP32 Development Environment

**Arduino IDE Setup:**
1. Install Arduino IDE 2.x
2. Add ESP32 board package:
   ```
   File → Preferences → Additional Board Manager URLs
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Install ESP32 board: Tools → Board Manager → "ESP32"
4. Select board: Tools → Board → ESP32 Dev Module

**Library Installation:**
```cpp
// Install via Library Manager:
- ArduinoJson by Benoit Blanchon
- WiFi (built-in)
- WebServer (built-in) 
- HTTPClient (built-in)
- EEPROM (built-in)
```

**Compilation Settings:**
```
Board: ESP32 Dev Module
Upload Speed: 921600
CPU Frequency: 240MHz (WiFi/BT)
Flash Frequency: 80MHz
Flash Mode: DIO
Flash Size: 4MB (32Mb)
Partition Scheme: Default 4MB
Core Debug Level: None
```

### Python Development Environment

**Virtual Environment Setup:**
```bash
# Create virtual environment
python -m venv ghost_protocol_env

# Activate (Windows)
ghost_protocol_env\Scripts\activate

# Activate (Linux/Mac)
source ghost_protocol_env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Environment Variables:**
```bash
# Optional environment variables
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export ESP32_IP="192.168.1.6"
export RELAYER_URL="http://localhost:5000"
```

### Solana Development Environment

**Anchor Project Setup:**
```bash
# Initialize Anchor workspace
anchor init ghost_protocol

# Build program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

**Solana CLI Configuration:**
```bash
# Set cluster to devnet
solana config set --url devnet

# Create wallet (save the seed phrase!)
solana-keygen new --outfile ~/.config/solana/id.json

# Get devnet SOL
solana airdrop 2

# Check balance
solana balance
```

---

## 🌐 Network Configuration

### Port Requirements

**ESP32 (Hardware Device):**
- **Port 80**: HTTP API server
- **Port 53**: DNS resolution
- **Port 123**: NTP time sync

**Relayer Service:**
- **Port 5000**: Flask API server
- **Port 443**: HTTPS to Solana RPC
- **Port 80**: HTTP to ESP32

**Client Application:**
- **Outbound 80**: ESP32 communication
- **Outbound 5000**: Relayer communication
- **Outbound 443**: Solana RPC (backup)

### Firewall Configuration

**Allow Outbound:**
```
ESP32 IP:80 (HTTP API)
Relayer IP:5000 (Bridge service)
api.devnet.solana.com:443 (Solana RPC)
rpc.ankr.com:443 (Backup RPC)
pool.ntp.org:123 (Time sync)
```

**Block Unnecessary:**
```
All inbound connections to client
Unnecessary outbound protocols
```

---

## 🔐 Security Configuration

### Cryptographic Settings

**ESP32 Entropy Sources:**
```cpp
// Hardware random number generator
esp_random()                  // RF noise, thermal noise

// Timing jitter
micros()                     // Microsecond timing variations

// Device-specific entropy  
WiFi.macAddress()            // Hardware MAC address
```

**Hash Functions:**
```cpp
// All cryptographic operations use SHA-256
mbedtls_sha256_context       // HMAC-SHA256 for signatures
                            // SHA-256 for credential IDs
                            // SHA-256 for PNI generation
```

### Access Control

**ESP32 API Security:**
- No authentication (device on trusted network)
- Rate limiting via mimicry storms
- Input validation for hex strings
- CORS disabled (local network only)

**Relayer Security:**
- Local network binding (127.0.0.1)
- Request timeout protection
- Input sanitization
- Error handling without info leakage

---

## 📊 Monitoring & Logging

### ESP32 Diagnostics

**Serial Monitor Output:**
```cpp
[PNI] Generated: A1B2C3D4... (rotation #1)
[API] Credential request received
[Credential] Generated successfully
[STORM] Mimicry storm triggered!
[STORM] Intensity: 27 decoys
```

**Health Check Endpoint:**
```
GET http://ESP32_IP/status
```

**Response:**
```json
{
  "pni_active": true,
  "pni_age_hours": 2,
  "pni_rotation": 1,
  "transaction_counter": 5,
  "credentials_generated": 5,
  "mimicry_active": true,
  "decoys_sent": 156,
  "storms_triggered": 5,
  "uptime_seconds": 7200,
  "free_heap": 298624
}
```

### Relayer Monitoring

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Log Format:**
```
2026-01-24 15:30:45 INFO: Relayer started successfully
2026-01-24 15:31:02 INFO: Payment submitted - TX: 21jT5jn...
2026-01-24 15:31:03 INFO: Transaction confirmed
```

---

## 🚀 Quick Start Checklist

### Pre-deployment Verification

**ESP32 Hardware:**
- [ ] ESP32 board connected and recognized
- [ ] WiFi credentials configured
- [ ] Firmware compiled without errors
- [ ] Serial monitor shows successful boot
- [ ] HTTP server responding on port 80
- [ ] PNI generated and stored in EEPROM

**Python Environment:**
- [ ] Virtual environment activated  
- [ ] All dependencies installed
- [ ] Client can connect to ESP32
- [ ] Relayer service starts successfully
- [ ] Solana RPC connectivity confirmed

**Solana Program:**
- [ ] Program deployed to devnet
- [ ] Program ID updated in client code
- [ ] Test wallet funded with SOL
- [ ] Token accounts created
- [ ] Relayer approved as delegate

**Network Connectivity:**
- [ ] ESP32 connected to WiFi
- [ ] ESP32 accessible from client machine
- [ ] Relayer can reach Solana RPC
- [ ] NTP time synchronization working

### First Payment Test

**Step 1: Start Services**
```bash
# Terminal 1 - Start relayer
cd solana-relayer
python relayer.py

# Terminal 2 - Test payment
cd client-app
python payment_client.py --merchant FEEVdMzQ... --amount 5.25 --token EknNCDd...
```

**Expected Output:**
```
✅ Payment Complete!
Transaction: 21jT5jnCnV2Br...
Privacy Features:
  ✓ Your wallet address NOT exposed to merchant
  ✓ Transaction buried in decoy storm  
  ✓ Relayer paid gas fees
  ✓ One-time credential burned
  ✓ Payment unlinkable to previous transactions
```

---

## 🔧 Troubleshooting Common Issues

### ESP32 Connection Issues

**WiFi Connection Failed:**
```cpp
// Check SSID and password in config
const char* WIFI_SSID = "Your_Network_Name";
const char* WIFI_PASSWORD = "your_password";

// Verify network is 2.4GHz (ESP32 doesn't support 5GHz)
// Check signal strength and distance to router
```

**HTTP Server Not Responding:**
```cpp
// Check serial monitor for IP address
Serial.print("[INFO] IP: ");
Serial.println(WiFi.localIP());

// Verify port 80 is not blocked by firewall
// Try accessing: http://ESP32_IP/status
```

### Python Dependency Issues

**Solana Library Conflicts:**
```bash
# Uninstall conflicting packages
pip uninstall anchorpy solana-py

# Install specific versions
pip install solders==0.26.0
pip install solana==0.36.6
```

**Import Errors:**
```python
# Verify virtual environment is activated
which python  # Should point to venv

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

### Solana Integration Issues

**RPC Connection Failures:**
```python
# Test RPC connectivity
curl -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' \
  https://api.devnet.solana.com
```

**Transaction Failures:**
```bash
# Check account balances
solana balance
spl-token balance EknNCDdz...

# Verify delegate approval
spl-token accounts EknNCDdz...
```

---

## 📞 Support Resources

**Documentation:**
- ESP32: https://docs.espressif.com/projects/esp32
- Solana: https://docs.solana.com/
- Anchor: https://project-serum.github.io/anchor/

**Community:**
- ESP32 Forums: https://www.esp32.com/
- Solana Discord: https://discord.gg/solana
- GitHub Issues: Create issues in the repository

---

**Configuration Complete!** 🎉

This document provides all necessary configuration steps for the Ghost Protocol system. Proceed to the ESP32 Setup Guide for hardware-specific implementation details.