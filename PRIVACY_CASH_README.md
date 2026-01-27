# Ghost Protocol + Privacy Cash Integration

## 🎯 What This Does

Combines **Ghost Protocol's** hardware security (ESP32 PNI) with **Privacy Cash's** audited zero-knowledge privacy protocol to enable truly private payments on Solana.

### Key Features:
- ✅ **Zero-knowledge privacy** - Mathematically proven, audited by 4 firms
- ✅ **Hardware entropy** - ESP32 generates secrets using physical sensors
- ✅ **No trusted intermediary** - ZK proofs verified on-chain
- ✅ **Unlinkable transactions** - Deposits cannot be linked to withdrawals
- ✅ **Mainnet ready** - Privacy Cash already deployed on Solana mainnet

---

## 🏗️ Architecture

```
Customer Wallet
      ↓
   ESP32 Device (generates hardware entropy)
      ↓
Privacy Cash Bridge (coordinates flow)
      ↓
Privacy Cash Pool (mainnet: 9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD)
      ↓
Solana Blockchain
      ↓
Merchant Receives Payment (customer identity hidden)
```

**Privacy Guarantee:** Merchant cannot link payment to customer wallet. No trusted party needed.

---

## 📋 Requirements

### Software:
- **Node.js 22+** (Privacy Cash SDK requires 24+, but works on 22)
- **Python 3.10+** (for ESP32 testing)
- **ESP32 Device** (for hardware entropy)

### Accounts:
- Solana wallet with some SOL for gas fees
- ESP32 connected to WiFi

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd f:\W3\gost_protocol
npm install
```

This installs:
- `privacycash` - Official Privacy Cash SDK
- `@solana/web3.js` - Solana JavaScript SDK
- `express` - HTTP server

### 2. Configure Environment

Create `.env` file:

```bash
# Solana RPC endpoint
SOLANA_RPC=https://api.devnet.solana.com

# ESP32 IP address
ESP32_HOST=10.214.161.157

# Bridge server port
PORT=8080
```

### 3. Start Privacy Cash Bridge

```bash
npm start
```

You should see:

```
============================================================
  Ghost Protocol + Privacy Cash Bridge
============================================================
🔗 Bridge Wallet: DvzV6MfL...
🌐 Solana RPC: https://api.devnet.solana.com
🔧 ESP32 Host: 10.214.161.157
🚀 Server: http://localhost:8080
============================================================
```

### 4. Test Private Payment

In another terminal:

```bash
npm test
```

This will:
1. ✅ Check bridge service health
2. ✅ Request hardware entropy from ESP32
3. ✅ Deposit 0.01 SOL into Privacy Cash pool
4. ✅ Withdraw to merchant privately
5. ✅ Display transaction signatures and explorer links

---

## 📡 API Endpoints

### POST /generate-secret
Generate secret using ESP32 hardware entropy

**Request:**
```bash
curl -X POST http://localhost:8080/generate-secret
```

**Response:**
```json
{
  "success": true,
  "secret": "a1b2c3d4e5f6...",
  "source": "ESP32 Hardware RNG"
}
```

---

### POST /shield
Deposit SOL into Privacy Cash pool

**Request:**
```bash
curl -X POST http://localhost:8080/shield \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 0.01,
    "secret": "a1b2c3d4e5f6..."
  }'
```

**Response:**
```json
{
  "success": true,
  "signature": "5KqR...",
  "commitment": "9f3e...",
  "secret": "a1b2c3d4...",
  "explorer": "https://explorer.solana.com/tx/..."
}
```

---

### POST /withdraw
Withdraw SOL from Privacy Cash pool to merchant

**Request:**
```bash
curl -X POST http://localhost:8080/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
    "amount": 0.01,
    "secret": "a1b2c3d4e5f6..."
  }'
```

**Response:**
```json
{
  "success": true,
  "signature": "2Xp9...",
  "recipient": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
  "amount": 0.01,
  "explorer": "https://explorer.solana.com/tx/..."
}
```

---

### POST /private-payment
Complete private payment (shield + withdraw in one call)

**Request:**
```bash
curl -X POST http://localhost:8080/private-payment \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
    "amount": 0.01
  }'
```

**Response:**
```json
{
  "success": true,
  "deposit": {
    "signature": "5KqR...",
    "explorer": "https://explorer.solana.com/tx/..."
  },
  "withdrawal": {
    "signature": "2Xp9...",
    "recipient": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
    "amount": 0.01,
    "explorer": "https://explorer.solana.com/tx/..."
  },
  "privacy": "Zero-knowledge proof verified on-chain"
}
```

---

### GET /health
Check service health

**Response:**
```json
{
  "status": "healthy",
  "wallet": "DvzV6MfL...",
  "balance": 0.9944,
  "rpc": "https://api.devnet.solana.com",
  "stats": {
    "deposits": 5,
    "withdrawals": 5,
    "totalVolume": 0.05
  }
}
```

---

### GET /stats
Get usage statistics

**Response:**
```json
{
  "deposits": 10,
  "withdrawals": 8,
  "totalVolume": 0.18
}
```

---

## 🔐 How Privacy Works

### Traditional Payment (NO Privacy):
```
Customer Wallet → Merchant Wallet
└─ Traceable on blockchain
```

### Privacy Cash + Ghost Protocol:
```
Step 1: Shield (Deposit)
Customer → Privacy Cash Pool
         (generates commitment)

Step 2: Withdraw (Payment)
Privacy Cash Pool → Merchant
         (ZK proof verifies ownership)

Result: Deposit and Withdrawal are UNLINKABLE!
```

**Privacy Guarantees:**
- ✅ Merchant cannot see customer wallet address
- ✅ Blockchain observer cannot link deposit to withdrawal
- ✅ Zero-knowledge proof mathematically verifies payment
- ✅ No trusted intermediary required

**Anonymity Set:**
- More users = better privacy
- 100 users in pool = 1% chance of linking
- 1000 users = 0.1% chance
- 10000+ users = effectively unlinkable

---

## 💰 Costs

### Transaction Fees (paid by customer):
- **Deposit (Shield)**: ~0.001 SOL (~$0.10)
- **Withdrawal (Pay Merchant)**: ~0.01 SOL (~$1.00)
- **Total per payment**: ~0.011 SOL (~$1.10)

### Bridge Operator Costs:
- **$0** - Bridge doesn't sign transactions!
- Customers pay their own fees
- No relayer funding needed

---

## 🧪 Testing

### Run Integration Test:
```bash
npm test
```

### Manual Testing:

1. **Generate Secret:**
```bash
curl -X POST http://localhost:8080/generate-secret
```

2. **Shield SOL:**
```bash
curl -X POST http://localhost:8080/shield \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.01, "secret": "YOUR_SECRET"}'
```

3. **Withdraw to Merchant:**
```bash
curl -X POST http://localhost:8080/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "MERCHANT_ADDRESS",
    "amount": 0.01,
    "secret": "YOUR_SECRET"
  }'
```

---

## 🚀 Deployment to Mainnet

### 1. Update .env for mainnet:
```bash
SOLANA_RPC=https://api.mainnet-beta.solana.com
```

### 2. Fund your wallet:
```bash
# Your wallet needs SOL for transactions
# Customers will pay their own fees
```

### 3. Start bridge:
```bash
npm start
```

### 4. Privacy Cash is already on mainnet!
```
Program ID: 9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD
Audited by: Accretion, HashCloak, Zigtur, Kriko
```

---

## 📊 Files Overview

```
f:\W3\gost_protocol\
├── privacy-cash-bridge.mjs      # Main bridge service (Privacy Cash SDK)
├── test-privacy-payment.mjs     # Integration test script
├── package.json                 # Dependencies & scripts
├── .env                         # Configuration
├── solana-relayer/
│   └── relayer-keypair.json    # Bridge wallet
└── esp32-pni/
    └── pni_core.ino            # ESP32 firmware (hardware entropy)
```

---

## 🎯 Next Steps

### Phase 1: Current (Working on Devnet) ✅
- Privacy Cash SDK integration
- ESP32 hardware entropy
- Bridge service
- End-to-end testing

### Phase 2: Enhanced Features (1-2 weeks)
- Add mimicry decoy transactions
- Mobile app integration
- Merchant dashboard
- Analytics & monitoring

### Phase 3: Production (2-3 weeks)
- Security audit of integration
- Load testing
- Mainnet deployment
- User documentation

### Phase 4: Advanced (1 month)
- SPL token support (Privacy Cash supports this)
- Multi-merchant routing
- Advanced privacy features
- SDK for third-party integration

---

## 🛠️ Troubleshooting

### "Cannot connect to ESP32"
```bash
# Check ESP32 IP address
ping 10.214.161.157

# Update .env with correct IP
ESP32_HOST=YOUR_ESP32_IP
```

### "Insufficient balance"
```bash
# Fund your wallet on devnet
solana airdrop 1 YOUR_WALLET_ADDRESS --url devnet

# Check balance
solana balance YOUR_WALLET_ADDRESS --url devnet
```

### "Privacy Cash SDK errors"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Resources

- **Privacy Cash SDK**: https://github.com/Privacy-Cash/privacy-cash-sdk
- **Privacy Cash Docs**: https://docs.privacy.cash
- **Mainnet Program**: `9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD`
- **Audit Reports**: https://privacy.cash/audits
- **Ghost Protocol**: https://github.com/yourusername/ghost_protocol

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Privacy Cash Team** - For audited privacy protocol
- **Solana Foundation** - For blockchain infrastructure
- **Security Auditors** - Accretion, HashCloak, Zigtur, Kriko

---

**Built with 💜 by Ghost Protocol Team**
