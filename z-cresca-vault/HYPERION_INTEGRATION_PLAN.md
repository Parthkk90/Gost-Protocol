# Hyperion CLMM Integration Plan

## Overview
Integrate Hyperion's Concentrated Liquidity Market Maker (CLMM) to enable yield generation on user collateral. This allows Z-Cresca users to earn trading fees while their USDC sits as collateral.

## Week 4: Research & Architecture (Current Phase)

### Objectives
- [ ] Research Hyperion CLMM program structure
- [ ] Understand position NFT mechanics
- [ ] Document CPI (Cross-Program Invocation) requirements
- [ ] Design integration architecture
- [ ] Set up devnet testing environment

### Hyperion CLMM Core Concepts

#### 1. Position NFTs
- Each liquidity position is represented by an NFT
- NFT holds metadata: liquidity amount, price range, fees earned
- Vault will custody the NFT as collateral representation

#### 2. Key Operations
```rust
// Core CLMM operations we need:
1. create_position(amount0, amount1, price_lower, price_upper) → Position NFT
2. add_liquidity(position_nft, amount0, amount1) → Updated position
3. remove_liquidity(position_nft, liquidity_amount) → (token0, token1)
4. collect_fees(position_nft) → (fees_token0, fees_token1)
5. close_position(position_nft) → Burns NFT
```

#### 3. CPI Account Requirements
```rust
#[derive(Accounts)]
pub struct DepositToHyperion<'info> {
    // Vault accounts
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,
    
    #[account(mut)]
    pub vault_usdc_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_sol_account: Account<'info, TokenAccount>,
    
    // Hyperion program accounts
    /// CHECK: Hyperion CLMM program ID (verified in constraints)
    pub hyperion_program: AccountInfo<'info>,
    
    /// CHECK: Hyperion pool (USDC-SOL)
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    
    /// CHECK: Position NFT mint (created by Hyperion)
    #[account(mut)]
    pub position_nft_mint: AccountInfo<'info>,
    
    /// CHECK: Position account (stores liquidity metadata)
    #[account(mut)]
    pub position_account: AccountInfo<'info>,
    
    // SPL programs
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
```

### Research Tasks

#### Task 1: Find Hyperion Program ID
```bash
# Search for Hyperion CLMM on Solana mainnet
solana program show <HYPERION_PROGRAM_ID> --url mainnet-beta

# Expected format: HypCLMM1111111111111111111111111111111111
```

**Known CLMM Programs on Solana:**
- Orca Whirlpools: `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc`
- Raydium CLMM: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
- Meteora DLMM: `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`

#### Task 2: Get Pool Address (USDC-SOL)
```typescript
// Find the USDC-SOL pool on Hyperion
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // Mainnet USDC
const SOL_MINT = "So11111111111111111111111111111111111111112";   // Wrapped SOL

// Pool derivation (typical pattern):
const [poolAddress] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("pool"),
    usdcMint.toBuffer(),
    solMint.toBuffer()
  ],
  HYPERION_PROGRAM_ID
);
```

#### Task 3: Test Position Creation on Devnet
```bash
# 1. Get devnet USDC and SOL
solana airdrop 2 --url devnet

# 2. Deploy test script
anchor test --skip-local-validator -- --url devnet

# 3. Monitor transaction logs
solana logs --url devnet
```

#### Task 4: Analyze Hyperion IDL
```bash
# Extract program IDL
anchor idl fetch <HYPERION_PROGRAM_ID> --provider.cluster mainnet

# Key instructions we need:
# - initialize_pool
# - open_position
# - modify_liquidity
# - collect_protocol_fee
# - swap (for rebalancing)
```

### Architecture Design

#### Flow: User Deposits Collateral
```
1. User calls: deposit_collateral(1000 USDC)
   ├─ Transfer 1000 USDC from user → vault
   ├─ Vault state: collateral_amount = 1000 USDC
   └─ Credit limit calculated: 1000 × 1.5 = 1500 USDC

2. Admin/Relayer calls: deposit_to_clmm(vault_id)
   ├─ Vault swaps 50% USDC → SOL (via Jupiter)
   │  └─ Result: 500 USDC + 2 SOL equivalent
   ├─ CPI to Hyperion: create_position(500 USDC, 2 SOL, price_range)
   │  └─ Returns: Position NFT
   ├─ Store NFT in vault: lp_position_nft = nft_address
   └─ Emit: PositionCreatedEvent

3. Continuous: Accrue yield from trading fees
   ├─ Every payment authorization checks: harvest_yield_if_needed()
   ├─ CPI to Hyperion: collect_fees(position_nft)
   │  └─ Returns: (fee_usdc, fee_sol)
   ├─ Update: vault.yield_earned += fees
   └─ Recalculate: credit_limit = (collateral + yield) × LTV
```

#### Flow: User Withdraws Collateral
```
1. User calls: withdraw_collateral(amount)
   ├─ Check: available_to_withdraw = collateral - (outstanding / LTV)
   ├─ If amount > available: return InsufficientCollateral
   └─ Proceed to liquidation

2. Vault calls: withdraw_from_clmm(amount_needed)
   ├─ Calculate liquidity to remove
   ├─ CPI to Hyperion: remove_liquidity(position_nft, liquidity)
   │  └─ Returns: (usdc_removed, sol_removed)
   ├─ Swap SOL → USDC (if needed)
   └─ Transfer USDC to user

3. Update vault state
   ├─ collateral_amount -= amount
   ├─ credit_limit = collateral × LTV
   └─ Check: outstanding_balance < credit_limit
```

### Yield Tracking Logic

```rust
// File: defi/hyperion.rs

pub fn calculate_yield_impact(
    current_fees: u64,
    position_value: u64,
    time_elapsed_seconds: i64
) -> Result<u64> {
    // APY = (fees / position_value) * (365 days / time_elapsed) * 10000
    let annualized_rate = (current_fees as u128)
        .checked_mul(31536000)?  // Seconds in year
        .checked_div(time_elapsed_seconds as u128)?
        .checked_div(position_value as u128)?
        .checked_mul(10000)? as u64;
    
    Ok(annualized_rate)
}

pub fn should_rebalance_position(
    current_price: u64,
    position_lower: u64,
    position_upper: u64
) -> bool {
    // If price moved >20% out of range, rebalance
    let range_center = (position_lower + position_upper) / 2;
    let deviation = current_price.abs_diff(range_center);
    
    deviation > (range_center * 20 / 100)
}
```

### Integration Checklist

#### Phase 1: Stub Implementation (This Week)
- [x] Create `defi/hyperion.rs` with function signatures
- [ ] Document expected account structures
- [ ] Write integration tests (mocked)
- [ ] Design error handling

#### Phase 2: SDK Integration (Week 5)
- [ ] Install Hyperion SDK: `npm install @hyperion/sdk`
- [ ] Implement position creation CPI
- [ ] Test on devnet with real pool
- [ ] Handle slippage and price impact

#### Phase 3: Yield Harvesting (Week 6)
- [ ] Implement `harvest_yield()` instruction
- [ ] Add automated harvesting trigger
- [ ] Emit yield events for frontend
- [ ] Test yield compounding

#### Phase 4: Position Management (Week 7)
- [ ] Implement liquidity addition/removal
- [ ] Build rebalancing logic
- [ ] Add emergency withdrawal
- [ ] Test edge cases

#### Phase 5: Mainnet Readiness (Week 8)
- [ ] Security audit of CPI calls
- [ ] Optimize transaction costs
- [ ] Add monitoring/alerts
- [ ] Deploy to mainnet

## Risk Mitigation

### Smart Contract Risks
1. **CPI Validation**: Always verify program IDs before CPI
2. **Slippage Protection**: Set max slippage on swaps
3. **Price Manipulation**: Use time-weighted average price (TWAP)
4. **LP Loss**: Monitor impermanent loss, exit if >5%

### Operational Risks
1. **Liquidity Crunch**: Keep 10% buffer in idle USDC
2. **Pool Unavailability**: Fallback to secondary DEX
3. **Price Deviation**: Circuit breaker if price moves >10%

## Alternative CLMM Options

If Hyperion unavailable, consider:
1. **Orca Whirlpools** - Most mature, best liquidity
2. **Raydium CLMM** - Good APYs, active community
3. **Meteora DLMM** - Dynamic fees, lower slippage

## Success Metrics

- **APY Target**: 5-15% on USDC-SOL pool
- **Harvest Frequency**: Every 24 hours or when fees > $10
- **Gas Costs**: <$0.50 per harvest
- **IL Threshold**: Exit if impermanent loss >5%

## Next Steps (Today)

1. ✅ Document integration architecture
2. 🔄 Research Hyperion program ID and IDL
3. 🔄 Create stub implementation files
4. ⏳ Write integration tests (mocked)
5. ⏳ Test on devnet with real pool

## References

- [Orca Whirlpools SDK](https://github.com/orca-so/whirlpools)
- [Raydium CLMM Docs](https://docs.raydium.io/raydium/concentrated-liquidity/)
- [Meteora DLMM](https://docs.meteora.ag/dlmm/)
- [Solana CPI Best Practices](https://docs.solana.com/developing/programming-model/calling-between-programs)
