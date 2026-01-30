# Z-Cresca Payment Relayer

The payment relayer is the **CRITICAL** bridge between physical card terminals and the Solana blockchain.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Merchant  │      │   Relayer   │      │    Solana    │
│  Terminal   │─────>│   Service   │─────>│   Program    │
│   (POS)     │ REST │  (Python)   │ RPC  │ (Z-Cresca)   │
└─────────────┘      └─────────────┘      └──────────────┘
      |                     |                      |
   Swipe card        Process payment        Execute on-chain
   $15.75            - Check credit          - Create burner
                     - Get Jupiter quote    - Swap SOL→USDC
                     - Submit transaction   - Pay merchant
```

## Features

✅ **REST API** - Receives payment requests from merchant terminals  
✅ **Privacy** - Creates burner wallets for each transaction  
✅ **Credit checks** - Validates available credit before approval  
✅ **Jupiter integration** - Gets optimal swap quotes  
✅ **Transaction building** - Constructs and submits Solana transactions  
✅ **Real-time** - <3 second payment authorization

## Quick Start

### 1. Install dependencies
```bash
cd relayer
pip install -r requirements.txt
```

### 2. Set environment variables
```bash
export RELAYER_SECRET_KEY="your_relayer_keypair_base58"
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export PROGRAM_ID="ZCrVau1tYqK7X2MpF9V8Z3mY4hR5wN6sT8dL1pQwR2z"
```

### 3. Start relayer
```bash
python payment_relayer.py
```

Relayer will start on `http://localhost:8080`

### 4. Test with simulator
In another terminal:
```bash
python merchant_terminal_simulator.py
```

## API Endpoints

### POST /api/v1/payment
Process a card payment

**Request:**
```json
{
  "card_hash": "sha256_of_card_number",
  "amount_usdc": 15750000,
  "merchant_id": "STARBUCKS_NYC_001",
  "merchant_wallet": "9fhQBb...",
  "terminal_id": "TERMINAL_001",
  "nonce": "1234567890"
}
```

**Response (Success):**
```json
{
  "approved": true,
  "transaction_signature": "5xyz...",
  "burner_address": "BURNxxx..."
}
```

**Response (Declined):**
```json
{
  "approved": false,
  "error": "Insufficient credit (available: $100.00)"
}
```

### POST /api/v1/register_card
Register a new card

**Request:**
```json
{
  "card_hash": "sha256_of_card_number",
  "vault_pubkey": "VAULTxxx..."
}
```

### GET /health
Health check

## Production Deployment

### Database Schema
```sql
CREATE TABLE cards (
    card_hash VARCHAR(64) PRIMARY KEY,
    vault_pubkey VARCHAR(44) NOT NULL,
    user_id UUID NOT NULL,
    activated_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    card_hash VARCHAR(64) NOT NULL,
    vault_pubkey VARCHAR(44) NOT NULL,
    merchant_id VARCHAR(100) NOT NULL,
    amount_usdc BIGINT NOT NULL,
    transaction_signature VARCHAR(88),
    burner_address VARCHAR(44),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (card_hash) REFERENCES cards(card_hash)
);
```

### Infrastructure
- **Compute**: AWS ECS / Kubernetes (2 vCPU, 4GB RAM)
- **Database**: PostgreSQL 15+ (managed RDS)
- **Cache**: Redis (for vault data caching)
- **Load Balancer**: ALB with SSL termination
- **Monitoring**: CloudWatch / Datadog

### Scaling
- Horizontal: 3+ relayer instances behind load balancer
- Target: 1000 TPS (transactions per second)
- Cache hit rate: >90% for vault lookups
- P99 latency: <500ms for payment authorization

## Security

### PCI Compliance
- ❌ Never store raw card numbers
- ✅ Only store SHA-256 hashes
- ✅ Use HTTPS for all API calls
- ✅ Merchant terminals validate SSL certificates

### Private Keys
- ✅ Relayer keypair stored in AWS Secrets Manager
- ✅ Rotated every 90 days
- ✅ Only has permission to submit transactions (not admin)

### Rate Limiting
```python
# Per card hash: 10 requests/minute
# Per merchant: 100 requests/minute
# Per IP: 50 requests/minute
```

## Monitoring

Key metrics to track:
- Payment approval rate (target: >95%)
- Average authorization time (target: <2s)
- Failed transactions (alert if >5% in 5 min)
- Jupiter quote failures
- Solana RPC failures

## Testing

### Unit tests
```bash
pytest tests/
```

### Load testing
```bash
# Simulate 100 concurrent payments
python load_test.py --concurrent=100 --duration=60
```

## Troubleshooting

**Error: "Card not registered"**
- Solution: Call `/api/v1/register_card` first

**Error: "Insufficient credit"**
- Solution: User needs to deposit more collateral or repay debt

**Error: "Transaction failed"**
- Check Solana RPC health
- Verify relayer has enough SOL for transaction fees
- Check program logs: `solana logs <PROGRAM_ID>`

## Next Steps

Week 23-25: Security audit & testing
Week 30-32: Mainnet deployment
