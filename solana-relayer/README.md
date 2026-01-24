# Solana Relayer Service

Python service that bridges ESP32 hardware credentials to Solana blockchain.

## Requirements

```bash
pip install aiohttp solana anchorpy solders python-dotenv base58
```

## Setup

1. **Generate Relayer Keypair**
```bash
solana-keygen new -o relayer-keypair.json
```

2. **Fund Relayer (Devnet)**
```bash
solana airdrop 1 relayer-keypair.json --url devnet
```

3. **Configure Environment**
```bash
# Create .env file
ESP32_HOST=192.168.1.100
SOLANA_RPC=https://api.devnet.solana.com
RELAYER_KEYPAIR=./relayer-keypair.json
```

## Run

```bash
python relayer.py
```

Server starts on port 8080.

## API Endpoints

### POST /submit-payment
Submit a payment credential from ESP32 to Solana.

**Request:**
```json
{
  "credential": {
    "credential_id": "3D2C3F8974DED912465F62EB1D13F12D",
    "signature": "2637884F52CE1A29...",
    "counter": 42,
    "timestamp": 1706234567,
    "merchant_pubkey": "FEEVdMzQ...",
    "amount": 5250000
  },
  "customer_token_account": "7v8d9f3a...",
  "customer_owner": "9t4f2a7b..."
}
```

### POST /request-from-esp32
Fetch credential from ESP32 and submit (for testing).

**Request:**
```json
{
  "merchant_pubkey": "FEEVdMzQ...",
  "amount": 5250000,
  "customer_token_account": "7v8d9f3a...",
  "customer_owner": "9t4f2a7b..."
}
```

### GET /stats
View relayer statistics.

### GET /health
Check service health.

## Architecture

```
ESP32 → HTTP → Relayer → RPC → Solana
[PNI]          [Bridge]         [Contract]
```

The relayer:
1. Receives credentials from ESP32 or client app
2. Constructs Solana transactions
3. Signs with relayer keypair
4. Submits to blockchain
5. Pays gas fees (gasless for customer)
