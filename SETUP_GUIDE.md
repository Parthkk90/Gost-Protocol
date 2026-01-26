# Ghost Protocol - Complete Setup Guide

## Quick Start: Syncing ESP32 with Solana Contract

This guide shows how to integrate all three components:
1. **ESP32 Hardware** (PNI + Mimicry)
2. **Relayer Service** (Bridge layer)
3. **Solana Smart Contract** (On-chain verification)

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   ESP32     │─────▶│  Relayer    │─────▶│   Solana    │
│  Hardware   │ HTTP │  Service    │ RPC  │  Contract   │
└─────────────┘      └─────────────┘      └─────────────┘
     │                     │                     │
  [Generate]          [Bridge]            [Verify &
  Credential]         [Pay Gas]            Process]
  + Storm]
```

---

## Step 1: Flash ESP32 Firmware

### 1.1 Hardware Setup
- ESP32 development board
- USB cable
- WiFi network

### 1.2 Configure Firmware
Edit [`esp32-pni/pni_solana_bridge.ino`](esp32-pni/pni_solana_bridge.ino):

```cpp
// WiFi Configuration
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
```

### 1.3 Flash Firmware

**Using Arduino IDE:**
```
1. Open pni_solana_bridge.ino
2. Tools → Board → ESP32 Dev Module
3. Tools → Port → Select your ESP32 port
4. Upload
```

**Using PlatformIO:**
```bash
cd esp32-pni
pio run --target upload
```

### 1.4 Verify Operation
Open Serial Monitor (115200 baud):
```
[PNI] Generated: a3f7c912... (rotation #1)
[WiFi] Connected!
[INFO] IP: 192.168.1.100
[API] HTTP server started
[OK] System ready!
```

Note the IP address - you'll need it!

---

## Step 2: Deploy Solana Contract

### 2.1 Build Contract
```bash
cd solana-program
anchor build
```

### 2.2 Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

Note the **Program ID** from output.

### 2.3 Initialize a Test Merchant
```bash
cd client
npm install
npm run init-merchant
```

This creates a test merchant account. Note the **Merchant Pubkey**.

---

## Step 3: Setup Relayer Service

### 3.1 Generate Relayer Keypair
```bash
solana-keygen new -o solana-relayer/relayer-keypair.json
```

### 3.2 Fund Relayer (Devnet)
```bash
solana airdrop 1 solana-relayer/relayer-keypair.json --url devnet
```

### 3.3 Configure Environment
Create `solana-relayer/.env`:
```bash
ESP32_HOST=192.168.1.100  # Your ESP32 IP from Step 1
SOLANA_RPC=https://api.devnet.solana.com
RELAYER_KEYPAIR=./relayer-keypair.json
```

### 3.4 Install Dependencies
```bash
cd solana-relayer
pip install -r requirements.txt
```

### 3.5 Start Relayer
```bash
python relayer.py
```

You should see:
```
[Relayer] Loaded keypair: 9t4f2a7b3c8d1e5f...
Relayer Balance: 1.0000 SOL
✅ Relayer service ready!
```

---

## Step 4: Test Complete Flow

### 4.1 Setup Client
```bash
cd client-app
pip install -r requirements.txt
```

Create `client-app/.env`:
```bash
ESP32_HOST=192.168.1.100
RELAYER_URL=http://localhost:8080
SOLANA_RPC=https://api.devnet.solana.com
WALLET_PATH=~/.config/solana/id.json
```

### 4.2 Check System Status
```bash
python payment_client.py --check-only
```

Expected output:
```
[ESP32] Status:
  PNI Active: True
  Counter: 0
  Mimicry Active: True

[Relayer] Health:
  Status: healthy
  Relayer Balance: 1.0000 SOL
```

### 4.3 Make a Test Payment
```bash
python payment_client.py \
  --merchant <MERCHANT_PUBKEY_FROM_STEP_2.3> \
  --amount 5.25 \
  --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

Watch the flow:
```
Step 1: Pre-flight checks ✓
Step 2: Get token account ✓
Step 3: Request credential from ESP32
  ⚡ Triggering mimicry storm...
  [STORM] Intensity: 67 decoys
  [OK] Storm complete in 3421 ms
  ✅ Credential received
Step 4: Submit to Solana via relayer
  ✅ Payment submitted!

✅ Payment Complete!
  ✓ Your wallet NOT exposed
  ✓ Transaction buried in decoys
  ✓ Relayer paid gas
```

---

## System Operation

### ESP32 Dashboard
Access in browser: `http://192.168.1.100`

Shows:
- PNI status and rotation
- Transaction counter
- Mimicry engine statistics
- Manual storm trigger

### Relayer Monitoring
Check relayer stats: `curl http://localhost:8080/stats`

```json
{
  "credentials_received": 5,
  "payments_submitted": 5,
  "payments_confirmed": 5,
  "payments_failed": 0
}
```

### Solana Explorer
View transactions: `https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet`

---

## Troubleshooting

### ESP32 not reachable
```bash
# Check ESP32 is on same network
ping 192.168.1.100

# Check ESP32 serial monitor for IP
# Might be different address
```

### "Credential Expired"
- Clock drift between ESP32 and Solana
- Solution: ESP32 syncs with NTP automatically
- Check serial monitor for NTP sync status

### "Low relayer balance"
```bash
# Fund relayer again
solana airdrop 1 relayer-keypair.json --url devnet
```

### "Token account not found"
- Make sure you have test tokens
- For devnet USDC, use a faucet or mint your own test token

---

## Production Deployment

### 1. Security Hardening
- [ ] Enable HTTPS on ESP32 (use ESP32 SSL/TLS)
- [ ] Secure relayer API with API keys
- [ ] Use hardware wallet for relayer keypair
- [ ] Rate limiting on all endpoints
- [ ] Monitor for anomalous patterns

### 2. Scalability
- [ ] Deploy multiple relayers (load balancing)
- [ ] Use Solana RPC providers (Alchemy, Helius)
- [ ] Cache merchant PDAs in relayer
- [ ] Optimize mimicry patterns

### 3. Mainnet Migration
- [ ] Audit smart contract
- [ ] Test extensively on devnet
- [ ] Deploy to mainnet with proper keypairs
- [ ] Fund relayer with adequate SOL
- [ ] Monitor gas costs

---

## Component Versions

| Component | File | Purpose |
|-----------|------|---------|
| ESP32 Firmware | `esp32-pni/pni_solana_bridge.ino` | Hardware: PNI + Mimicry + API |
| Solana Contract | `solana-program/programs/ghost_protocol/src/lib.rs` | On-chain: Verification |
| Relayer Service | `solana-relayer/relayer.py` | Bridge: ESP32 → Solana |
| Client App | `client-app/payment_client.py` | User: Orchestration |

---

## Next Steps

1. **Test thoroughly** on devnet with various scenarios
2. **Measure privacy metrics**: noise-to-signal ratio, timing
3. **Optimize mimicry patterns** for your use case
4. **Build merchant dashboard** to view payments
5. **Create mobile app** for consumer payments
6. **Audit security** before mainnet deployment

---

## Support

- Documentation: See [ESP32_SOLANA_INTEGRATION.md](ESP32_SOLANA_INTEGRATION.md)
- Architecture: See [PNI_ARCHITECTURE.md](esp32-pni/PNI_ARCHITECTURE.md)
- Contract Spec: See [solana-program/README.md](solana-program/README.md)

**System Status:** ✅ All components integrated and ready for testing!
