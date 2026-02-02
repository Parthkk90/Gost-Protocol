# Z-Cresca Yield-Backed Credit Card Vault

**The world's first self-paying credit card** - Your collateral generates yield while you spend.

## 🎯 Overview

Z-Cresca Vault is a Solana program that enables users to:
- Deposit collateral (USDC/SOL) into yield-generating positions
- Earn 10-20% APY from Hyperion CLMM liquidity provision
- Access credit lines backed by collateral + yield
- Make privacy-preserving card payments using ZK proofs
- Enjoy net positive returns (yield > interest)

## 🏗️ Architecture

```
User Deposits $1000 USDC
        ↓
Vault deploys to Hyperion CLMM (SOL/USDC)
        ↓
Earns 12% APY ($120/year) from trading fees
        ↓
User gets $1500 credit line (1.5x LTV)
        ↓
User spends on card, pays 3% interest ($45/year)
        ↓
Net profit: $75/year (while spending!)
```

## 📦 Project Structure

```
z-cresca-vault/
├── programs/
│   └── z_cresca_vault/
│       └── src/
│           ├── lib.rs              # Program entrypoint
│           ├── state/              # Account structures
│           │   ├── global_state.rs
│           │   ├── credit_vault.rs
│           │   └── lp_position.rs
│           ├── instructions/       # Program instructions
│           │   ├── initialize_global_state.rs
│           │   ├── initialize_vault.rs
│           │   ├── deposit_collateral.rs
│           │   ├── authorize_payment.rs
│           │   └── ...
│           ├── defi/              # DeFi integrations
│           │   ├── hyperion.rs    # CLMM integration
│           │   └── jupiter.rs     # Swap routing
│           ├── credit/            # Credit logic
│           │   ├── interest.rs
│           │   └── risk.rs
│           ├── zk/                # ZK proof verification
│           │   └── verifier.rs
│           ├── errors.rs          # Error codes
│           └── constants.rs       # Program constants
├── Anchor.toml
└── Cargo.toml
```

## 🚀 Getting Started

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1
```

### Build

```bash
cd z-cresca-vault
anchor build
```

### Test

```bash
anchor test
```

### Deploy

```bash
# Devnet
anchor deploy --provider.cluster devnet

# Mainnet (after audit)
anchor deploy --provider.cluster mainnet
```

## 📋 Program Instructions

### 1. Initialize Protocol (Admin Only)
```rust
initialize_global_state(
    default_ltv: 150,           // 1.5x leverage
    base_interest_rate: 200,    // 2% APR
)
```

### 2. Create User Vault
```rust
initialize_vault(
    vault_id: 0,  // First vault for user
)
```

### 3. Deposit Collateral
```rust
deposit_collateral(
    amount: 1_000_000_000,  // 1000 USDC (6 decimals)
)
```

### 4. Authorize Payment (Called by Relayer)
```rust
authorize_payment(
    amount: 50_000_000,      // $50
    merchant: <merchant_pubkey>,
)
// Returns: bool (approved/declined)
```

### 5. Calculate Credit Limit
```rust
calculate_credit_limit()
// Returns: u64 (new credit limit)
```

### 6. Harvest Yield (Automated)
```rust
harvest_yield()
// Returns: (u64, u64) (fees_token0, fees_token1)
```

## 🏦 Account Structures

### CreditVault
```rust
pub struct CreditVault {
    pub owner: Pubkey,
    pub collateral_amount: u64,
    pub credit_limit: u64,
    pub outstanding_balance: u64,
    pub yield_earned: u64,
    pub interest_paid: u64,
    pub lp_position_nft: Pubkey,
    pub current_interest_rate: u16,
    pub daily_limit: u64,
    pub active: bool,
    // ... more fields
}
```

### GlobalState
```rust
pub struct GlobalState {
    pub authority: Pubkey,
    pub total_collateral: u64,
    pub total_credit_issued: u64,
    pub default_ltv: u16,
    pub base_interest_rate: u16,
    pub paused: bool,
    // ... more fields
}
```

## 🔐 Security Features

- **Integer Overflow Protection**: All math uses `checked_*` operations
- **Authorization Checks**: Owner/authority validation on all sensitive operations
- **Emergency Pause**: Admin can pause protocol in case of emergency
- **Liquidation Engine**: Automatic liquidation when health factor < 1.2
- **Daily Spending Limits**: Prevent excessive spending
- **Reentrancy Guards**: Protected against reentrancy attacks

## 🧪 Testing Strategy

1. **Unit Tests**: Test individual instructions
2. **Integration Tests**: Test full user flows
3. **Fuzz Testing**: Randomized input testing
4. **Security Audit**: Professional audit before mainnet

## 📊 Key Metrics

- **LTV Ratio**: 150% (1.5x leverage)
- **Base Interest Rate**: 2% APR
- **Max Interest Rate**: 20% APR (cap)
- **Liquidation Threshold**: Health factor < 1.2
- **Minimum Collateral**: 1 USDC
- **Default Daily Limit**: $1000

## 🛣️ Roadmap

### Phase 1: Core Vault (Current)
- ✅ Account structures
- ✅ Basic instructions (init, deposit, authorize)
- ✅ Credit limit calculation
- ✅ Interest accrual logic
- 🔄 Testing framework

### Phase 2: DeFi Integration (Weeks 4-8)
- ⏳ Hyperion CLMM integration
- ⏳ Jupiter swap routing
- ⏳ Yield harvesting automation
- ⏳ Position rebalancing

### Phase 3: Privacy Layer (Weeks 13-18)
- ⏳ Burner wallet system
- ⏳ ZK credit proof circuits (Noir)
- ⏳ Privacy-preserving payments
- ⏳ On-chain proof verification

### Phase 4: Production (Weeks 25-32)
- ⏳ Security audit
- ⏳ Mainnet deployment
- ⏳ Dashboard UI
- ⏳ Hardware card integration

## 🤝 Contributing

This is a production financial system. All contributions must:
1. Include comprehensive tests
2. Follow Rust best practices
3. Be security-reviewed
4. Include documentation

## 📄 License

TBD

## 🆘 Support

- GitHub Issues: [Create Issue]
- Discord: [Join Server]
- Email: support@zcresca.io

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Not financial advice.

---

**Status**: 🚧 In Development  
**Network**: Devnet  
**Last Updated**: January 28, 2026
