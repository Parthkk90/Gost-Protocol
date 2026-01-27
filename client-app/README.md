# Ghost Protocol - Client Application

User-facing payment client that orchestrates the complete flow, now with **cross-chain Ghost Swap** support via SilentSwap V2.

## Setup

```bash
pip install -r requirements.txt
npm install @silentswap/sdk  # For cross-chain features
```

## Configuration

Create `.env` file:
```bash
ESP32_HOST=192.168.1.100
RELAYER_URL=http://localhost:8080
SOLANA_RPC=https://api.mainnet-beta.solana.com
WALLET_PATH=~/.config/solana/id.json
SILENT_SWAP_API_KEY=your_api_key  # For cross-chain swaps
```

## New Feature: Cross-Chain Payments

Ghost Protocol now supports private payments across blockchains! Shield SOL, swap to USDC/ETH, and deliver to merchants on Ethereum, Bitcoin, or other chains.

### Usage for Cross-Chain Payment
```bash
# Use the new JavaScript client for cross-chain
node ../ghost-swap-payment.mjs
```

Or integrate into Python client (future update).

## What Happens (Updated Flow)

```
1. Client checks ESP32 + Relayer status
2. Client creates SilentSwap order for cross-chain transfer
3. ESP32 generates hardware entropy for ZK proofs
4. Client executes deposit to SilentSwap vault
5. Funds are shielded, swapped if needed, and delivered privately
6. Merchant receives on target chain (untraceable)
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
