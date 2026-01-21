# Ghost Protocol - Implementation Roadmap

**Goal:** Privacy-preserving retail crypto payments using hardware-generated noise

**Current Status:** ✅ Phase 1 Complete (PNI Core working on ESP32)

---

## Phase 2: Payment Credential System (CURRENT)
**Timeline:** 2-3 days  
**Status:** Starting Now

### 2.1 Credential Derivation (Day 1)
- [ ] Add PaymentCredential struct to ESP32
- [ ] Implement derive_credential() function
- [ ] SHA-256 hashing: PNI + counter + merchant + timestamp
- [ ] Test: Generate 100 credentials, verify uniqueness
- [ ] Serial command: `generate <merchant_id>`

**Deliverable:** ESP32 generates one-time payment credentials

### 2.2 Transaction Counter (Day 1)
- [ ] Add counter to EEPROM storage
- [ ] Auto-increment on each credential generation
- [ ] Prevent counter rollback (security)
- [ ] Serial command: `counter` to show current count

**Deliverable:** Replay attack prevention

### 2.3 Credential Format & Signing (Day 2)
- [ ] Define credential structure (ID, timestamp, signature)
- [ ] HMAC-SHA256 signature using PNI as key
- [ ] Credential validity window (5 minutes)
- [ ] Export credential in JSON format

**Deliverable:** Signed, time-bound credentials

### 2.4 Testing & Validation (Day 2)
- [ ] Python validator script
- [ ] Test credential uniqueness
- [ ] Test signature verification
- [ ] Test replay prevention
- [ ] Performance benchmark (credentials/second)

**Deliverable:** Validated credential system

---

## Phase 3: Zero-Knowledge Proofs (Week 2)
**Timeline:** 3-4 days  
**Status:** Not Started

### 3.1 ZK Proof Library Selection
- [ ] Research: zk-SNARKs vs zk-STARKs vs Bulletproofs
- [ ] ESP32 compatibility check
- [ ] Choose library (likely: circom + snarkjs or simple Schnorr)
- [ ] Proof generation time < 1 second

### 3.2 Proof Circuit Design
- [ ] Prove: "I have valid PNI without revealing it"
- [ ] Prove: "Counter is correct without showing value"
- [ ] Prove: "Timestamp is recent"
- [ ] Circuit constraints < 100K

### 3.3 Integration
- [ ] Add proof generation to ESP32
- [ ] Add proof verification (Python/JS)
- [ ] Test: Generate + verify 1000 proofs

**Deliverable:** Privacy-preserving credential verification

---

## Phase 4: Communication Layer (Week 3)
**Timeline:** 2-3 days  
**Status:** Not Started

### 4.1 Bluetooth Low Energy (BLE)
- [ ] ESP32 BLE server setup
- [ ] Credential transmission protocol
- [ ] Pairing with phone wallet
- [ ] Security: Encrypted channel

### 4.2 Phone Wallet App (Basic)
- [ ] React Native or Flutter app
- [ ] Connect to ESP32 via BLE
- [ ] Receive credentials
- [ ] Display payment status
- [ ] Basic UI (amount input, merchant select)

### 4.3 Alternative: NFC (Optional)
- [ ] Add NFC module to ESP32
- [ ] Tap-to-pay functionality
- [ ] Android/iOS NFC reading

**Deliverable:** Wireless payment initiation

---

## Phase 5: Merchant Verification System (Week 4)
**Timeline:** 3-4 days  
**Status:** Not Started

### 5.1 Verification Server (Backend)
- [ ] Node.js/Python API server
- [ ] Endpoint: POST /verify-payment
- [ ] Used-credential database (prevent replay)
- [ ] Rate limiting, DDoS protection

### 5.2 Merchant Dashboard
- [ ] Web interface for merchants
- [ ] Real-time payment verification
- [ ] Transaction history
- [ ] Merchant ID generation

### 5.3 Point-of-Sale Integration
- [ ] QR code payment flow
- [ ] API integration examples
- [ ] Test merchant accounts
- [ ] Documentation for merchants

**Deliverable:** Complete payment verification infrastructure

---

## Phase 6: Production Hardening (Week 5-6)
**Timeline:** 1-2 weeks  
**Status:** Not Started

### 6.1 Hardware Optimizations
- [ ] Add hardware TRNG (Infinite Noise USB)
- [ ] GPIO LED indicators (status, TX, error)
- [ ] OLED display (show PNI age, counter, status)
- [ ] Battery optimization (deep sleep modes)
- [ ] Case design (3D printable enclosure)

### 6.2 Security Audit
- [ ] Penetration testing
- [ ] Side-channel attack analysis
- [ ] Credential replay testing
- [ ] PNI linking attack testing
- [ ] Third-party security review

### 6.3 Performance Optimization
- [ ] Credential generation < 100ms
- [ ] Memory usage < 200KB
- [ ] Battery life > 7 days
- [ ] BLE connection < 2 seconds

**Deliverable:** Production-ready device

---

## Phase 7: User Experience (Week 7)
**Timeline:** 3-4 days  
**Status:** Not Started

### 7.1 Wallet App (Full)
- [ ] Onboarding flow
- [ ] Device pairing wizard
- [ ] Transaction history
- [ ] Settings (rotation interval, etc.)
- [ ] Push notifications

### 7.2 Merchant Tools
- [ ] Integration SDK (JavaScript, Python)
- [ ] WooCommerce plugin
- [ ] Shopify app
- [ ] API documentation
- [ ] Sandbox environment

### 7.3 Documentation
- [ ] User manual
- [ ] Developer docs
- [ ] Video tutorials
- [ ] FAQ / Troubleshooting

**Deliverable:** User-friendly complete system

---

## Phase 8: Network Effects (Month 2-3)
**Timeline:** Ongoing  
**Status:** Not Started

### 8.1 Relay Network Integration
- [ ] Flashbots integration
- [ ] Eden Network integration
- [ ] Private mempool support
- [ ] MEV protection

### 8.2 Multi-Chain Support
- [ ] Ethereum mainnet
- [ ] Polygon
- [ ] Arbitrum
- [ ] Optimism
- [ ] BSC

### 8.3 Partnerships
- [ ] Coffee shop pilot program
- [ ] Online merchant integration
- [ ] Crypto exchange support
- [ ] Wallet provider partnerships

**Deliverable:** Real-world adoption

---

## Current Sprint: Phase 2.1 (TODAY)

### Immediate Tasks (Next 2 Hours):

**Task 1:** Add PaymentCredential struct to pni_core.ino
```cpp
struct PaymentCredential {
    uint8_t credential_id[16];  // 128-bit ID
    uint32_t timestamp;
    uint32_t counter;
    char merchant_id[32];
    uint8_t signature[32];
};
```

**Task 2:** Implement credential derivation
```cpp
void derive_credential(
    PNI* pni, 
    uint32_t counter,
    const char* merchant_id,
    PaymentCredential* cred
);
```

**Task 3:** Add serial command `generate <merchant>`
```
> generate starbucks_sf_001
[Credential] Generated for merchant: starbucks_sf_001
[Credential] ID: 8A3F...
[Credential] Counter: 42
[Credential] Valid until: 15:47:23
```

**Task 4:** Test uniqueness
- Generate 100 credentials
- Verify all different
- Verify counter increments

---

## Success Metrics

### Phase 2 Complete When:
- ✅ ESP32 generates unique credentials
- ✅ Counter increments correctly
- ✅ Credentials are signed (HMAC)
- ✅ Python can verify credentials
- ✅ No duplicate credentials in 10,000 tests

### Full Project Complete When:
- User can pay at coffee shop with ESP32 device
- Merchant never sees wallet address
- Payment completes in < 2 seconds
- Transaction unlinkable to previous payments
- Works on mobile phone via BLE

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ZK proofs too slow on ESP32 | High | Use simpler Schnorr proofs instead |
| BLE connection unreliable | Medium | Add NFC fallback |
| Merchant adoption low | High | Build compelling demo + pilot |
| Security vulnerability | Critical | Third-party audit + bug bounty |
| Battery life too short | Medium | Deep sleep optimization |

---

## Next Command to Run:

```
START PHASE 2.1: Update ESP32 firmware with credential system
```

**Ready to begin implementation!**
