# Ghost Protocol - ESP32 Setup & Implementation Guide

## 🎯 Overview

This document provides detailed implementation steps for the ESP32 hardware component of the Ghost Protocol system. The ESP32 serves as a Personal Noise Injector (PNI) - a hardware security module that generates privacy-preserving payment credentials.

---

## 🔧 Hardware Setup

### ESP32 Board Selection

**Recommended Boards:**
- **ESP32-D0WD-V3** (DevKit V1) - Primary choice
- **ESP32-WROOM-32** - Alternative option
- **ESP32-S3** - Advanced option with enhanced security

**Specifications Required:**
```
CPU: Dual-core 240MHz
Flash: 4MB minimum
RAM: 520KB SRAM  
WiFi: 802.11 b/g/n
Bluetooth: 4.2 (not used but available)
ADC: 12-bit (for entropy collection)
Hardware RNG: Built-in
```

### Physical Connections

**Basic Setup (USB Power):**
```
ESP32 DevKit ──── USB Cable ──── Computer
      │
      └── Built-in WiFi Antenna (no external connections needed)
```

**Advanced Setup (External Power):**
```
ESP32 Pin    Connection
─────────────────────────
VIN          5V DC Power Supply
GND          Ground
EN           Pull-up resistor (10kΩ) to 3.3V
GPIO0        Boot button (optional)
```

**No External Sensors Required:**
- Uses built-in hardware random number generator
- Leverages WiFi RF noise for entropy
- Utilizes internal temperature sensor
- Employs timing jitter from system clocks

---

## 💻 Development Environment Setup

### Arduino IDE Configuration

**Step 1: Install Arduino IDE**
```bash
# Download Arduino IDE 2.0+ from:
# https://www.arduino.cc/en/software

# Alternative: VS Code with PlatformIO extension
```

**Step 2: Add ESP32 Board Package**
```
1. Open Arduino IDE
2. File → Preferences
3. Additional Board Manager URLs:
   https://dl.espressif.com/dl/package_esp32_index.json
4. Tools → Board → Board Manager
5. Search "ESP32" → Install "ESP32 by Espressif Systems"
```

**Step 3: Configure Board Settings**
```
Board: ESP32 Dev Module
Upload Speed: 921600
CPU Frequency: 240MHz (WiFi/BT)
Flash Frequency: 80MHz  
Flash Mode: DIO
Flash Size: 4MB (32Mb)
Partition Scheme: Default 4MB with spiffs
Core Debug Level: None (for production)
Port: COM3 (Windows) or /dev/ttyUSB0 (Linux)
```

### Required Libraries

**Install via Library Manager:**
```cpp
// Core libraries (built-in with ESP32)
#include <WiFi.h>              // ESP32 WiFi
#include <WebServer.h>         // HTTP server
#include <HTTPClient.h>        // HTTP client
#include <EEPROM.h>            // Flash storage
#include <esp_random.h>        // Hardware RNG
#include <time.h>              // NTP sync

// External library (install separately)  
#include <ArduinoJson.h>       // Version 6.21.0+
```

**Installation Commands:**
```
Tools → Manage Libraries → Search:
- "ArduinoJson" by Benoit Blanchon (install latest)
```

---

## 🏗️ Firmware Implementation

### Core System Architecture

```cpp
/*
 * Ghost Protocol - PNI Solana Bridge
 * Complete integration: PNI + Mimicry + Solana Credentials
 */

// ===================================================================
// SYSTEM COMPONENTS
// ===================================================================

┌─────────────────────────────────────────────────────────────────┐
│                     ESP32 Firmware Structure                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Hardware Entropy Collection                                │
│     - esp_random() - RF noise, thermal variations              │
│     - micros() - High-resolution timing jitter                 │
│     - WiFi.macAddress() - Device-specific entropy              │
│                                                                 │
│  2. PNI (Personal Noise Injector) Generation                   │
│     - SHA-256 hash of multiple entropy sources                 │ 
│     - 32-byte cryptographically secure identifier              │
│     - Auto-rotation every 24 hours                             │
│     - EEPROM persistence across reboots                        │
│                                                                 │
│  3. Payment Credential Generation                               │
│     - HMAC-SHA256 signatures using PNI as key                  │
│     - Unique credential_id for each payment                    │
│     - Counter-based replay protection                          │
│     - 5-minute validity window                                 │
│                                                                 │
│  4. Mimicry Engine                                              │
│     - Continuous decoy RPC requests                            │
│     - Storm generation on payment requests                     │
│     - 20-35 fake Solana queries per storm                      │
│     - Random timing intervals (8-30 seconds)                   │
│                                                                 │
│  5. HTTP API Server                                             │
│     - GET /credential - Generate payment credentials           │
│     - GET /status - System health monitoring                   │
│     - GET / - Web dashboard interface                          │
│     - POST /storm - Manual storm trigger                       │
└─────────────────────────────────────────────────────────────────┘
```

### Key Implementation Details

**1. Entropy Collection Function:**
```cpp
void collect_entropy(uint8_t* output, size_t len) {
  for (size_t i = 0; i < len; i++) {
    uint32_t rng = esp_random();        // Hardware RNG
    output[i] = (rng ^ micros()) & 0xFF; // XOR with timing
    delayMicroseconds(100);             // Add timing variance
  }
}
```

**2. PNI Generation Process:**
```cpp
void generate_pni(PNI* pni) {
  // Collect 64 bytes of hardware entropy
  uint8_t entropy[64];
  collect_entropy(entropy, 64);
  
  // Mix with device-specific data
  uint32_t timestamp = millis();
  uint8_t mac[6];
  WiFi.macAddress(mac);
  
  // Combine everything with SHA-256
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts(&ctx, 0);
  mbedtls_sha256_update(&ctx, entropy, 64);
  mbedtls_sha256_update(&ctx, (uint8_t*)&timestamp, 4);
  mbedtls_sha256_update(&ctx, mac, 6);
  mbedtls_sha256_update(&ctx, (uint8_t*)&pni->rotation_count, 4);
  mbedtls_sha256_finish(&ctx, pni->identifier);
  mbedtls_sha256_free(&ctx);
  
  // Save to EEPROM for persistence
  EEPROM.put(EEPROM_PNI_ADDR, *pni);
  EEPROM.commit();
}
```

**3. Credential Generation (Core Algorithm):**
```cpp
SolanaCredential generate_credential(const char* merchant_hex, 
                                   uint64_t amount, 
                                   const char* customer_hex) {
  // Increment transaction counter (replay protection)
  transaction_counter++;
  EEPROM.put(EEPROM_COUNTER_ADDR, transaction_counter);
  EEPROM.commit();
  
  // Convert hex strings to 32-byte arrays
  uint8_t merchant_bytes[32], customer_bytes[32];
  for (int i = 0; i < 32; i++) {
    sscanf(merchant_hex + (i * 2), "%2hhx", &merchant_bytes[i]);
    sscanf(customer_hex + (i * 2), "%2hhx", &customer_bytes[i]);
  }
  
  // Prepare data as little-endian bytes (Solana format)
  uint8_t counter_bytes[8], timestamp_bytes[8];
  for (int i = 0; i < 8; i++) {
    counter_bytes[i] = (cred.counter >> (i * 8)) & 0xFF;
    timestamp_bytes[i] = (cred.timestamp >> (i * 8)) & 0xFF;
  }
  
  // HMAC-SHA256 signature: SHA256(PNI || message)
  // Message = counter || merchant || timestamp || customer
  // NOTE: Amount is NOT included (matches Solana contract)
  mbedtls_sha256_context hmac_ctx;
  mbedtls_sha256_init(&hmac_ctx);
  mbedtls_sha256_starts(&hmac_ctx, 0);
  mbedtls_sha256_update(&hmac_ctx, current_pni.identifier, PNI_SIZE);
  mbedtls_sha256_update(&hmac_ctx, counter_bytes, 8);
  mbedtls_sha256_update(&hmac_ctx, merchant_bytes, 32);
  mbedtls_sha256_update(&hmac_ctx, timestamp_bytes, 8);
  mbedtls_sha256_update(&hmac_ctx, customer_bytes, 32);
  mbedtls_sha256_finish(&hmac_ctx, cred.signature);
  mbedtls_sha256_free(&hmac_ctx);
  
  // Credential ID: SHA256(signature || counter || merchant || timestamp || customer)
  // First 16 bytes used as unique identifier
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts(&ctx, 0);
  mbedtls_sha256_update(&ctx, cred.signature, 32);
  mbedtls_sha256_update(&ctx, counter_bytes, 8);
  mbedtls_sha256_update(&ctx, merchant_bytes, 32);
  mbedtls_sha256_update(&ctx, timestamp_bytes, 8);
  mbedtls_sha256_update(&ctx, customer_bytes, 32);
  uint8_t hash[32];
  mbedtls_sha256_finish(&ctx, hash);
  mbedtls_sha256_free(&ctx);
  
  memcpy(cred.credential_id, hash, 16);  // Take first 128 bits
}
```

**4. Mimicry Engine Implementation:**
```cpp
void send_solana_decoy() {
  // Select random RPC endpoint
  const char* rpc_url = SOLANA_RPC_ENDPOINTS[random(SOLANA_RPC_COUNT)];
  
  // Generate random Solana RPC method call
  const char* methods[] = {
    "getAccountInfo", "getBalance", "getTokenAccountBalance",
    "getTokenSupply", "getProgramAccounts"
  };
  const char* method = methods[random(5)];
  
  // Create JSON-RPC request
  StaticJsonDocument<512> doc;
  doc["jsonrpc"] = "2.0";
  doc["id"] = random(1, 10000);
  doc["method"] = method;
  
  // Add random program address as parameter
  JsonArray params = doc.createNestedArray("params");
  params.add(KNOWN_PROGRAMS[random(PROGRAM_COUNT)].address);
  
  String request;
  serializeJson(doc, request);
  
  // Send request (fire-and-forget)
  HTTPClient http;
  http.begin(rpc_url);
  http.addHeader("Content-Type", "application/json");
  http.POST(request);
  http.end();
  
  total_decoys++;
}

void generate_storm() {
  int intensity = random(STORM_INTENSITY_MIN, STORM_INTENSITY_MAX);
  
  for (int i = 0; i < intensity; i++) {
    send_solana_decoy();
    delay(random(20, 80));  // Random spacing between requests
  }
  
  storms_triggered++;
}
```

---

## 📡 Network Configuration

### WiFi Setup

**Connection Configuration:**
```cpp
// WiFi credentials (configure in config.h)
const char* WIFI_SSID = "Your_Network_Name";
const char* WIFI_PASSWORD = "your_password";

void setup_wifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] WiFi connected!");
    Serial.print("[INFO] IP: ");
    Serial.println(WiFi.localIP());  // Note this IP address!
  } else {
    Serial.println("\n[ERROR] WiFi failed!");
  }
}
```

**Network Requirements:**
- **2.4GHz WiFi** (ESP32 doesn't support 5GHz)
- **WPA2/WPA3** security (WEP not supported)
- **DHCP** enabled (or configure static IP)
- **Internet access** for NTP sync and mimicry engine
- **Port 80** open for HTTP API

### NTP Time Synchronization

```cpp
void setup_time() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("[NTP] Syncing time...");
  
  time_t now = 0;
  int retries = 0;
  while (now < 1000000000 && retries < 20) {
    time(&now);
    delay(500);
    retries++;
  }
  
  Serial.printf("[NTP] Current time: %ld\n", now);
}
```

**Time is Critical for:**
- Payment credential timestamps
- PNI rotation scheduling
- Credential validity windows
- Storm timing coordination

---

## 🔄 Flash and Testing Process

### Compilation and Upload

**Step 1: Configure WiFi**
```cpp
// Edit these lines in the code:
const char* WIFI_SSID = "Your_Network_Name";      // Replace with your WiFi name
const char* WIFI_PASSWORD = "your_password";      // Replace with your WiFi password
```

**Step 2: Compile Firmware**
```
Arduino IDE:
1. Open pni_solana_bridge.ino
2. Tools → Board → ESP32 Dev Module  
3. Tools → Port → (select your ESP32 port)
4. Sketch → Verify/Compile
5. Wait for "Done compiling" message
```

**Step 3: Flash to ESP32**
```
1. Connect ESP32 via USB
2. Press and hold BOOT button on ESP32
3. Click Upload in Arduino IDE
4. Release BOOT button when upload starts
5. Wait for "Hard resetting via RTS pin..."
```

**Step 4: Monitor Serial Output**
```
Tools → Serial Monitor
Baud Rate: 115200

Expected output:
=================================================
   Ghost Protocol - Solana Bridge
   PNI + Mimicry + Solana Credentials  
=================================================

[EEPROM] Forcing reset...
[EEPROM] Loaded counter: 0
[PNI] Generating new identifier...
[PNI] Generated: A1B2C3D4E5F6... (rotation #1)
[WiFi] Connecting to Your_Network_Name
..........
[OK] WiFi connected!
[INFO] IP: 192.168.1.6
[NTP] Syncing time...
[NTP] Current time: 1737732645
[API] HTTP server started
[API] Dashboard: http://192.168.1.6
[OK] System ready!
[INFO] Mimicry engine active
```

### Initial Testing

**Test 1: Basic Connectivity**
```bash
# Open browser and navigate to ESP32 IP
http://192.168.1.6

# Should show Ghost Protocol dashboard with:
# - PNI Status (Active, Age, Rotation count)
# - Transaction Stats (Credentials Generated, Counter)
# - Mimicry Engine (Decoys sent, Storms triggered)
```

**Test 2: Status API**
```bash
curl http://192.168.1.6/status
```

**Expected Response:**
```json
{
  "pni_active": true,
  "pni_age_hours": 0,
  "pni_rotation": 1,
  "transaction_counter": 0,
  "credentials_generated": 0,
  "mimicry_active": true,
  "decoys_sent": 12,
  "storms_triggered": 0,
  "uptime_seconds": 65,
  "free_heap": 298624
}
```

**Test 3: Credential Generation**
```bash
curl "http://192.168.1.6/credential?merchant=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456&amount=1000000&customer=fedcba0987654321098765432109876543210fedcba0987654321098765432109"
```

**Expected Response:**
```json
{
  "credential_id": "A1B2C3D4E5F67890123456789ABCDEF0",
  "signature": "DEF123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
  "counter": 1,
  "timestamp": 1737732700,
  "merchant_pubkey": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "customer_owner": "fedcba0987654321098765432109876543210fedcba0987654321098765432109", 
  "amount": 1000000,
  "valid_until": 1737733000,
  "pni_generation": 1
}
```

---

## 🔧 Advanced Configuration

### EEPROM Management

**Storage Layout:**
```cpp
Address Range   Purpose
─────────────────────────────
0-7            Transaction counter (uint64_t)
8-47           PNI structure (40 bytes)
48-511         Reserved for future use
```

**Force Reset (Development Only):**
```cpp
// Add to setup() function for fresh start
Serial.println("[EEPROM] Forcing reset...");
for (int i = 0; i < EEPROM_SIZE; i++) {
  EEPROM.write(i, 0);
}
EEPROM.commit();
transaction_counter = 0;
```

**Remove Reset Code (Production):**
```cpp
// Comment out or delete these lines after first successful boot:
// Serial.println("[EEPROM] Forcing reset...");
// for (int i = 0; i < EEPROM_SIZE; i++) {
//   EEPROM.write(i, 0);
// }
// EEPROM.commit();
// transaction_counter = 0;
```

### Performance Optimization

**Memory Usage:**
```cpp
// Monitor free heap in loop()
if (millis() % 30000 == 0) {  // Every 30 seconds
  Serial.printf("[Memory] Free heap: %d bytes\n", ESP.getFreeHeap());
}

// Typical usage: ~298KB free (out of 520KB total)
```

**CPU Optimization:**
```cpp
// Reduce mimicry frequency if needed
#define HEARTBEAT_MIN 15000    // Increase to 15s
#define HEARTBEAT_MAX 45000    // Increase to 45s

// Reduce storm intensity
#define STORM_INTENSITY_MIN 10  // Reduce to 10
#define STORM_INTENSITY_MAX 20  // Reduce to 20
```

### Security Hardening

**Remove Debug Output (Production):**
```cpp
// Comment out verbose logging:
// Serial.printf("[API] Merchant (hex): %s\n", merchant.c_str());
// Serial.printf("[API] Customer (hex): %s\n", customer.c_str());
// Serial.printf("[API] Amount: %llu\n", amount);
```

**Enable Watchdog Timer:**
```cpp
#include "esp_system.h"

void setup() {
  // Enable hardware watchdog (8 seconds)
  esp_task_wdt_init(8, true);
  esp_task_wdt_add(NULL);
}

void loop() {
  // Reset watchdog periodically
  esp_task_wdt_reset();
}
```

---

## 🐛 Troubleshooting Guide

### Common Flash Issues

**Upload Failed: "Failed to connect to ESP32"**
```
Solutions:
1. Hold BOOT button while clicking Upload
2. Try different USB cable (data cable, not just power)
3. Check driver installation for ESP32
4. Reduce upload speed: Tools → Upload Speed → 115200
5. Press EN button after BOOT to reset
```

**Compilation Errors:**
```cpp
// Error: mbedtls/sha256.h not found
// Solution: ESP32 board package version issue
// Install ESP32 package version 2.0.11 or later

// Error: ArduinoJson.h not found  
// Solution: Install ArduinoJson library
// Tools → Manage Libraries → Search "ArduinoJson"
```

### Runtime Issues

**WiFi Connection Failed:**
```
Symptoms: Continuous dots "........"
Debug steps:
1. Verify SSID and password are correct
2. Check network is 2.4GHz (not 5GHz)  
3. Move ESP32 closer to router
4. Check for special characters in password
5. Try different WiFi network
```

**HTTP Server Not Responding:**
```
Symptoms: Browser shows "This site can't be reached"
Debug steps:
1. Check serial monitor for IP address
2. Verify ESP32 and computer on same network
3. Ping ESP32 IP: ping 192.168.1.6
4. Check firewall blocking port 80
5. Try different port in code (8080, 8000)
```

**Mimicry Engine Issues:**
```
Symptoms: No decoy requests being sent
Debug steps:
1. Check internet connectivity
2. Verify RPC endpoints are accessible
3. Monitor serial output for storm messages
4. Test manual storm: POST http://ESP32_IP/storm
```

### Diagnostic Commands

**Memory Analysis:**
```cpp
void print_memory_info() {
  Serial.printf("[Memory] Free heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("[Memory] Largest block: %d bytes\n", ESP.getMaxAllocHeap());
  Serial.printf("[Memory] Min free heap: %d bytes\n", ESP.getMinFreeHeap());
}
```

**Network Diagnostics:**
```cpp
void print_network_info() {
  Serial.printf("[WiFi] SSID: %s\n", WiFi.SSID().c_str());
  Serial.printf("[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
  Serial.printf("[WiFi] Gateway: %s\n", WiFi.gatewayIP().toString().c_str());
  Serial.printf("[WiFi] DNS: %s\n", WiFi.dnsIP().toString().c_str());
  Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
}
```

---

## 🎉 Congratulations!

If you've reached this point successfully, your ESP32 is now:

- ✅ **Connected to WiFi** and accessible via HTTP
- ✅ **Generating cryptographically secure PNIs** using hardware entropy
- ✅ **Creating signed payment credentials** with HMAC-SHA256
- ✅ **Running mimicry engine** to provide cover traffic
- ✅ **Storing state persistently** in EEPROM
- ✅ **Syncing time via NTP** for accurate timestamps
- ✅ **Serving HTTP API** for client integration

Your ESP32 hardware is now ready for integration with the Solana payment system!

**Next Steps:**
1. Note down your ESP32's IP address (shown in serial monitor)
2. Test the HTTP endpoints to ensure they're working
3. Proceed to the System Integration Guide
4. Configure the Python client to connect to your ESP32

**Security Note:**
Remember to remove the EEPROM reset code after your first successful deployment to prevent losing your PNI and transaction counter on subsequent reboots.

---

**ESP32 Implementation Complete!** 🚀

Proceed to the Final Integration Guide to connect your ESP32 with the complete Ghost Protocol payment system.