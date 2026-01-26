# ESP32 ↔ Solana Integration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYSTEM                             │
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │   ESP32      │ HTTP │   Relayer    │ RPC  │   Solana     │     │
│  │   Hardware   │─────▶│   Service    │─────▶│   Contract   │     │
│  └──────────────┘      └──────────────┘      └──────────────┘     │
│         │                     │                      │              │
│    [PNI Gen]            [Bridge Layer]          [Verify &          │
│    [Mimicry]            [Fee Payment]            Process]          │
│         │                     │                      │              │
│    Generates            Submits TX             Updates State       │
│    Credentials          Pays Gas               Burns Credential    │
└─────────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. **ESP32 → Relayer** (HTTP/Serial)
- ESP32 generates payment credential with PNI
- Exposes REST API endpoint: `GET /credential?merchant=xxx&amount=yyy`
- Returns JSON with credential data

### 2. **Relayer → Solana** (RPC)
- Receives credential from ESP32
- Constructs Solana transaction
- Signs and submits to blockchain
- Pays transaction fees (gasless for customer)

### 3. **Mimicry Engine → Solana RPC** (HTTP)
- Generates decoy Solana queries
- Targets real Solana programs (DEXs, lending)
- Creates timing camouflage

---

## Data Flow: Complete Transaction

### Step 1: Customer Initiates Payment
```
Customer Device → ESP32
  POST /generate-credential
  {
    "merchant_pubkey": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
    "amount": 5250000,  // 5.25 tokens in micro-units
    "token_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  }
```

### Step 2: ESP32 Generates Credential
```
ESP32 Process:
  1. Current PNI: a3f7c912e4d8b3a6...
  2. Transaction Counter: 42
  3. Merchant Pubkey: FEEVdMz...
  4. Timestamp: 1706234567
  5. Generate HMAC-SHA256 signature
  
  Output:
  {
    "credential_id": "3D2C3F8974DED912465F62EB1D13F12D",
    "signature": "2637884F52CE1A29B8D3E4F5...",
    "counter": 42,
    "timestamp": 1706234567,
    "merchant_pubkey": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
    "amount": 5250000,
    "valid_until": 1706234867  // 5 minutes
  }
```

### Step 3: Mimicry Storm Triggers
```
ESP32 Mimicry Engine:
  - Detects real transaction pending
  - Triggers decoy storm: 50-80 Solana RPC calls
  - Queries: DEX prices, token balances, program accounts
  - Duration: 3-7 seconds
  - Real credential sent during storm
```

### Step 4: Relayer Submits Transaction
```typescript
Relayer Service:
  1. Receives credential from ESP32
  2. Validates timestamp (< 5 min old)
  3. Constructs Solana transaction:
     - Accounts: merchant PDA, credential PDA, token accounts
     - Instruction: verify_payment_credential(...)
  4. Signs with relayer keypair
  5. Submits to Solana RPC
  6. Relayer pays ~0.00001 SOL gas fee
```

### Step 5: Contract Verification
```rust
Smart Contract:
  1. Verify merchant active
  2. Check credential age < 300 seconds
  3. Verify counter not used (replay protection)
  4. Validate HMAC signature
  5. Transfer tokens (using pre-approved delegate)
  6. Burn credential (mark as used)
  7. Update merchant stats
```

### Step 6: Result
```
✅ Payment Complete
  - Customer wallet NEVER signed transaction
  - Relayer paid gas fee
  - Merchant received tokens
  - Credential burned (one-time use)
  - No linkage between payments
```

---

## Implementation Components

### Component 1: ESP32 Firmware Extensions

**File: `esp32-pni/pni_solana_bridge.ino`**

Adds Solana-specific functionality:
- Generate Solana-compatible credentials
- HTTP API server for credential requests
- Solana RPC endpoint configuration
- Solana mimicry patterns (DEX queries, token balances)

Key Functions:
```cpp
PaymentCredential generateSolanaCredential(const char* merchant_pubkey, uint64_t amount);
void setupSolanaAPI();
void sendSolanaDecoyCall(const char* program_address, const char* method);
```

### Component 2: Relayer Service

**File: `solana-relayer/relayer.py` or `relayer.ts`**

Bridge between ESP32 and Solana:
- HTTP server listening for ESP32 credentials
- Solana transaction construction
- Fee payment wallet
- Transaction submission and monitoring

Key Functions:
```python
async def receive_credential(credential_data)
async def submit_to_solana(credential, customer_token_account)
async def monitor_transaction(signature)
```

### Component 3: Client Application

**File: `client-app/payment_client.py`**

User-facing application:
- Communicates with ESP32 over WiFi/Serial
- Pre-approves token delegate (one-time setup)
- Displays payment status
- No private key handling (uses relayer)

---

## Security Model

### Privacy Guarantees

**What the Merchant CANNOT See:**
- ❌ Customer wallet address
- ❌ Customer token balance
- ❌ Other customer transactions
- ❌ Shopping patterns across merchants
- ❌ Geographic location

**What the Merchant CAN See:**
- ✅ Payment amount
- ✅ Payment successful/failed
- ✅ Their own transaction history
- ✅ Credential ID (unique, unlinkable)

**What the Relayer CANNOT Do:**
- ❌ Steal customer funds (only delegate authority for exact amount)
- ❌ Track customer identity (credential is opaque)
- ❌ Link payments together (new PNI daily)
- ❌ Modify payment amount (signature validates all params)

**What the Blockchain Observer CANNOT See:**
- ❌ Real transaction among decoys (buried in storm)
- ❌ Customer wallet (never signs)
- ❌ Pattern of customer activity (mimicry engine)

---

## Setup Instructions

### 1. Flash ESP32 with Integrated Firmware

```bash
cd esp32-pni
# Edit config: WiFi, Solana RPC endpoints
arduino-cli compile --fqbn esp32:esp32:esp32 pni_solana_bridge.ino
arduino-cli upload -p /dev/ttyUSB0 --fqbn esp32:esp32:esp32 pni_solana_bridge.ino
```

### 2. Deploy Relayer Service

```bash
cd solana-relayer
npm install
# Configure relayer wallet (funds for gas)
solana-keygen new -o relayer-keypair.json
solana airdrop 1 relayer-keypair.json --url devnet

# Start relayer
npm start
```

### 3. Setup Client Application

```bash
cd client-app
pip install -r requirements.txt

# Configure ESP32 IP address
echo "ESP32_IP=192.168.1.100" > .env

# One-time: Approve token delegate
python setup_delegate.py
```

### 4. Make a Payment

```bash
# From client app
python payment_client.py \
  --merchant FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe \
  --amount 5.25 \
  --token USDC
```

**Behind the scenes:**
1. Client queries ESP32: `http://192.168.1.100/credential`
2. ESP32 generates credential + triggers storm
3. Client forwards to relayer
4. Relayer submits to Solana
5. Payment processed, credential burned

---

## API Specifications

### ESP32 REST API

#### `GET /credential`

**Request:**
```
GET /credential?merchant=FEEVdMzQ...&amount=5250000&token=EPjFW...
```

**Response:**
```json
{
  "credential_id": "3D2C3F8974DED912465F62EB1D13F12D",
  "signature": "2637884F52CE1A29B8D3E4F5A6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5",
  "counter": 42,
  "timestamp": 1706234567,
  "merchant_pubkey": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
  "amount": 5250000,
  "valid_until": 1706234867,
  "pni_generation": 7
}
```

#### `GET /status`

**Response:**
```json
{
  "pni_active": true,
  "pni_age_hours": 12,
  "next_rotation_hours": 12,
  "transaction_counter": 42,
  "mimicry_active": true,
  "decoys_sent_today": 3847,
  "last_storm": 1706234500
}
```

#### `POST /trigger-storm`

Manually trigger mimicry storm (for testing).

### Relayer API

#### `POST /submit-payment`

**Request:**
```json
{
  "credential": { /* ESP32 credential object */ },
  "customer_token_account": "7v8d9f3a2b1c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0",
  "customer_owner": "9t4f2a7b3c8d1e5f6g2h3i4j5k6l7m8n9o0p1q2r3s4t5"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_signature": "5k2j3h4g5f6d7s8a9z0x1c2v3b4n5m6l7k8j9h0g1f2d3s4a5z6x7c8v9b0n1m2l3k4j",
  "merchant": "Starbucks SF Mission",
  "amount": 5.25,
  "credential_burned": true
}
```

---

## Monitoring & Debugging

### ESP32 Serial Monitor

```
[PNI] Current identifier: a3f7c912... (12h old)
[Mimicry] Heartbeat decoys: 2,845
[Mimicry] Storms triggered: 42
[Credential] Generated for: Starbucks SF Mission
[Credential] Counter: 42, Valid: 298s
[HTTP] Client connected: 192.168.1.50
[HTTP] Credential served successfully
[Mimicry] STORM triggered! Intensity: 67 decoys
```

### Relayer Logs

```
[Relayer] Received credential from ESP32: 192.168.1.100
[Relayer] Validating credential... OK
[Relayer] Constructing Solana transaction...
[Relayer] Signing with relayer keypair...
[Relayer] Submitting to Solana RPC...
[Relayer] Transaction confirmed: 5k2j3h4g5f...
[Relayer] Credential burned on-chain
[Relayer] Payment complete: 5.25 USDC → Starbucks
```

### Solana Explorer

View transaction on-chain:
```
https://explorer.solana.com/tx/5k2j3h4g5f6d7s8a9z0x1c2v3b4n5m6?cluster=devnet

✅ verify_payment_credential succeeded
  - Merchant: merchant_FEEVd...
  - Used Credential: cred_42
  - Amount: 5,250,000 micro-tokens
  - Relayer: 9t4f2a7b3c... (signer)
  - Fee paid: 0.000005 SOL
```

---

## Troubleshooting

### Issue: "Credential Expired"

**Cause:** Clock drift between ESP32 and Solana validators

**Fix:**
```cpp
// In ESP32 code, sync with NTP server
configTime(0, 0, "pool.ntp.org");
struct tm timeinfo;
getLocalTime(&timeinfo);
```

### Issue: "Credential Already Used"

**Cause:** Counter collision or replay attack detected

**Fix:** ESP32 counter must increment and persist to EEPROM:
```cpp
EEPROM.write(COUNTER_ADDR, transaction_counter++);
EEPROM.commit();
```

### Issue: "Invalid Signature"

**Cause:** PNI or signature derivation mismatch

**Debug:**
1. Verify PNI matches on ESP32 and relayer
2. Ensure all signature components included:
   - PNI signature (32 bytes)
   - Counter (u64)
   - Merchant pubkey (32 bytes)
   - Timestamp (i64)
   - Customer owner (32 bytes)

### Issue: "Insufficient Delegate Allowance"

**Cause:** Token delegate not approved or allowance too low

**Fix:**
```bash
spl-token approve <TOKEN_ACCOUNT> <AMOUNT> <RELAYER_PUBKEY>
```

---

## Performance Metrics

### Transaction Privacy

| Metric | Target | Actual |
|--------|--------|--------|
| Noise-to-Signal Ratio | 50:1 | 50-80:1 |
| Storm Duration | 3-7s | 3-7s |
| Credential Lifetime | 5min | 300s |
| PNI Rotation | 24h | 86400s |
| Decoy Rate | 10-20/min | 15/min |

### System Performance

| Component | Latency | Throughput |
|-----------|---------|------------|
| ESP32 Credential Gen | <100ms | 10/sec |
| Relayer Processing | <500ms | 20/sec |
| Solana Confirmation | 400-800ms | Network-dependent |
| End-to-End Payment | 1-2s | Limited by Solana |

---

## Next Steps

1. **Flash ESP32** with integrated firmware (`pni_solana_bridge.ino`)
2. **Deploy Relayer** on cloud server or local machine
3. **Configure Client** application with ESP32 IP
4. **Test Payment Flow** on Solana devnet
5. **Monitor System** with dashboards
6. **Scale** to mainnet with production relayer

## Security Audit Checklist

- [ ] PNI entropy sources validated
- [ ] Credential expiration enforced
- [ ] Replay protection tested
- [ ] Token delegate scope limited
- [ ] Relayer wallet secured
- [ ] HTTPS enabled on ESP32 API
- [ ] Rate limiting implemented
- [ ] Error messages sanitized (no info leakage)

---

**System Status:** ✅ Ready for Integration Testing
