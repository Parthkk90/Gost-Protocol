# Ghost Protocol - Client Application

User-facing payment client that orchestrates the complete flow.

## Setup

```bash
pip install -r requirements.txt
```

## Configuration

Create `.env` file:
```bash
ESP32_HOST=192.168.1.100
RELAYER_URL=http://localhost:8080
SOLANA_RPC=https://api.devnet.solana.com
WALLET_PATH=~/.config/solana/id.json
```

## Usage

### Check System Status
```bash
python payment_client.py --check-only
```

### Make a Payment
```bash
python payment_client.py \
  --merchant FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe \
  --amount 5.25 \
  --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## What Happens

```
1. Client checks ESP32 + Relayer status
2. Client looks up your token account
3. Client requests credential from ESP32
   → ESP32 generates PNI-based credential
   → ESP32 triggers mimicry storm (50-70 decoys)
4. Client forwards credential to relayer
5. Relayer constructs Solana transaction
6. Relayer signs and submits (pays gas)
7. Smart contract verifies and processes
8. Credential burned, payment complete
```

## Privacy Guarantees

✅ Your wallet address NEVER signs the transaction
✅ Your transaction buried in decoy storm  
✅ Relayer pays gas fees (not you)
✅ One-time credential (cannot be reused)
✅ Merchant cannot track you across payments

## Requirements

- ESP32 running `pni_solana_bridge.ino`
- Relayer service running (`python relayer.py`)
- Solana wallet with token balance
- Merchant initialized on Ghost Protocol contract
