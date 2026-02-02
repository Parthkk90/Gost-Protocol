/**
 * Week 5 Implementation Roadmap
 * Orca Whirlpools Real CPI Integration
 */

# Week 5: Orca Whirlpools Integration (Days 1-7)

## Overview
Transform stub CLMM functions into real Orca Whirlpools CPI calls for devnet testing.

## Prerequisites ✅
- [x] Orca SDK installed (@orca-so/whirlpools-sdk v0.18.0)
- [x] Core vault program compiled (15/15 tests passing)
- [x] Devnet deployment successful
- [x] CLMM stubs implemented (deposit_to_clmm, harvest_yield, withdraw_from_clmm)

---

## Day 1-2: Pool Discovery & Setup (8 hours)

### Task 1.1: Discover Devnet Pools
**Commands:**
```bash
# Install ts-node if not present
npm install --save-dev ts-node @types/node

# Run discovery
npm run discover-pools
```

**Expected Output:**
- List of available USDC-SOL Whirlpools on devnet
- Pool addresses, fee tiers, liquidity levels
- If no pools found: Create test pool or switch to Raydium/Meteora

### Task 1.2: Document Pool Constants
Create `programs/z_cresca_vault/src/defi/orca_constants.rs`:
```rust
use anchor_lang::prelude::*;

/// Orca Whirlpool Program ID
pub const ORCA_WHIRLPOOL_PROGRAM_ID: Pubkey = pubkey!("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");

/// Devnet USDC-SOL Pool (0.3% fee tier)
/// TODO: Update after running discover-pools script
pub const USDC_SOL_POOL: Pubkey = pubkey!("REPLACE_WITH_ACTUAL_POOL_ADDRESS");

/// Pool fee tier
pub const FEE_TIER: u16 = 3000; // 0.3%

/// Tick spacing
pub const TICK_SPACING: u16 = 64;
```

---

## Day 2-4: Implement Real CPI (16 hours)

### Task 2.1: Refactor defi/hyperion.rs → defi/orca.rs
**Changes:**
1. Rename module: `mod hyperion` → `mod orca`
2. Import Orca account structures
3. Add CPI builder functions

**File: `programs/z_cresca_vault/src/defi/orca.rs`**

Key functions to implement:
```rust
/// Build open_position CPI instruction
pub fn build_open_position_accounts<'info>(
    vault: &Account<'info, CreditVault>,
    pool: &AccountInfo<'info>,
    position: &AccountInfo<'info>,
    position_mint: &AccountInfo<'info>,
    position_token_account: &AccountInfo<'info>,
    token_owner_account_a: &AccountInfo<'info>,
    token_owner_account_b: &AccountInfo<'info>,
    token_vault_a: &AccountInfo<'info>,
    token_vault_b: &AccountInfo<'info>,
    tick_array_lower: &AccountInfo<'info>,
    tick_array_upper: &AccountInfo<'info>,
    funder: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    rent: &AccountInfo<'info>,
    associated_token_program: &AccountInfo<'info>,
) -> Result<Instruction> {
    // Build Orca open_position instruction
    // See: https://orca-so.github.io/whirlpools/
}

/// Execute increase_liquidity CPI
pub fn increase_liquidity_cpi<'info>(
    // ... accounts ...
    liquidity_amount: u128,
    token_max_a: u64,
    token_max_b: u64,
) -> Result<()> {
    // CPI call to Orca
}

/// Execute collect_fees CPI
pub fn collect_fees_cpi<'info>(
    // ... accounts ...
) -> Result<(u64, u64)> {
    // Returns (fees_a, fees_b)
}
```

### Task 2.2: Update deposit_to_clmm.rs
**Key changes:**
1. Add `remaining_accounts` to Context
2. Parse Orca-specific accounts from remaining_accounts
3. Call real CPI instead of stub

```rust
#[derive(Accounts)]
pub struct DepositToCLMM<'info> {
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// CHECK: Orca Whirlpool Program
    pub orca_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    
    // All Orca accounts passed via remaining_accounts:
    // [0] pool
    // [1] position (PDA to be created)
    // [2] position_mint
    // [3] position_token_account
    // [4] token_owner_account_a
    // [5] token_owner_account_b
    // [6] token_vault_a
    // [7] token_vault_b
    // [8] tick_array_lower
    // [9] tick_array_upper
}

pub fn handler(
    ctx: Context<DepositToCLMM>,
    amount_usdc: u64,
    amount_sol: u64,
    price_lower: u128,
    price_upper: u128,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    
    // Validate remaining accounts
    require!(
        ctx.remaining_accounts.len() >= 10,
        ZCrescaError::MissingOrcaAccounts
    );
    
    // Parse accounts
    let pool = &ctx.remaining_accounts[0];
    let position = &ctx.remaining_accounts[1];
    // ... etc
    
    // Build and execute CPI
    let position_nft = orca::open_position_cpi(
        // ... all accounts ...
    )?;
    
    // Store position NFT
    vault.lp_position_nft = position_nft;
    
    Ok(())
}
```

### Task 2.3: Update harvest_yield.rs
Similar pattern: parse remaining_accounts, call `orca::collect_fees_cpi()`.

### Task 2.4: Update withdraw_from_clmm.rs  
Call `orca::decrease_liquidity_cpi()` and `orca::close_position_cpi()`.

---

## Day 4-5: Testing Infrastructure (8 hours)

### Task 3.1: Create Test Helper Functions
**File: `tests/helpers/orca-helpers.ts`**

```typescript
import { PublicKey, Keypair } from "@solana/web3.js";
import { WhirlpoolContext, buildWhirlpoolClient } from "@orca-so/whirlpools-sdk";

export async function findOrCreatePool(
  ctx: WhirlpoolContext,
  tokenA: PublicKey,
  tokenB: PublicKey,
  feeTier: number
): Promise<PublicKey> {
  // Find existing pool or create new one
}

export async function getPoolAccounts(
  poolAddress: PublicKey,
  positionMint: PublicKey
): Promise<{
  pool: PublicKey;
  tickArrayLower: PublicKey;
  tickArrayUpper: PublicKey;
  tokenVaultA: PublicKey;
  tokenVaultB: PublicKey;
}> {
  // Derive all required Orca PDA accounts
}
```

### Task 3.2: Update Test Suite
**File: `tests/z_cresca_vault.ts`**

Add new test cases:
```typescript
describe("CLMM Integration (Real Orca)", () => {
  let poolAddress: PublicKey;
  let positionMint: Keypair;
  
  before(async () => {
    // Discover or create pool
    poolAddress = await findOrCreatePool(/* ... */);
  });
  
  it("Should deposit to Orca Whirlpool", async () => {
    const orcaAccounts = await getPoolAccounts(poolAddress, positionMint.publicKey);
    
    const tx = await program.methods
      .depositToClmm(
        new BN(100_000_000), // 100 USDC
        new BN(1_000_000_000), // 1 SOL
        new BN(50), // price_lower
        new BN(200) // price_upper
      )
      .accounts({
        vault: vaultPda,
        owner: provider.wallet.publicKey,
        orcaProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .remainingAccounts([
        { pubkey: orcaAccounts.pool, isSigner: false, isWritable: true },
        { pubkey: positionMint.publicKey, isSigner: false, isWritable: true },
        // ... all 10 accounts
      ])
      .signers([positionMint])
      .rpc();
      
    console.log("Position created:", tx);
    
    // Verify position NFT stored
    const vaultData = await program.account.creditVault.fetch(vaultPda);
    assert.ok(!vaultData.lpPositionNft.equals(PublicKey.default));
  });
  
  it("Should harvest yield from Orca", async () => {
    // Wait for fees to accrue (or simulate trades)
    await sleep(5000);
    
    const tx = await program.methods.harvestYield().accounts(/* ... */).rpc();
    
    // Verify yield_earned increased
    const vault = await program.account.creditVault.fetch(vaultPda);
    assert.ok(vault.yieldEarned.gt(new BN(0)));
  });
});
```

---

## Day 6-7: Devnet Testing & Debugging (8 hours)

### Task 4.1: Deploy Updated Program
```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Task 4.2: Run Test Suite
```bash
anchor test --skip-local-validator --provider.cluster devnet
```

**Success Criteria:**
- ✅ Position creation successful (transaction confirms)
- ✅ Position NFT minted and stored in vault
- ✅ Fees accrue over 24 hours (>$0.01)
- ✅ Harvest yield increases credit limit
- ✅ Withdrawal returns funds to vault
- ✅ All operations <200k compute units
- ✅ Transaction costs <$0.50 each

### Task 4.3: Manual Verification
```bash
# Check position on Orca UI
# Devnet: https://www.orca.so/pools (select devnet)

# Verify vault state
solana account <VAULT_PDA> --url devnet

# Check position NFT
spl-token account-info <POSITION_NFT_MINT> --url devnet
```

---

## Deliverables

### Code Deliverables
- [ ] `defi/orca_constants.rs` - Pool addresses and constants
- [ ] `defi/orca.rs` - Real CPI implementation (replacing hyperion.rs)
- [ ] Updated `deposit_to_clmm.rs` with remaining_accounts
- [ ] Updated `harvest_yield.rs` with real fee collection
- [ ] Updated `withdraw_from_clmm.rs` with position closing
- [ ] `tests/helpers/orca-helpers.ts` - Test utilities
- [ ] Updated test suite with 5+ Orca integration tests

### Documentation
- [ ] Pool discovery results (addresses, liquidity, fees)
- [ ] CPI account mapping diagram
- [ ] Compute unit measurements
- [ ] Gas cost analysis
- [ ] Error handling guide

### Metrics to Track
- Transaction success rate (target: >95%)
- Average compute units per operation
- Fees collected per position (target: >$0.10/day)
- Position creation time (target: <5 seconds)
- Credit limit increase from yield (verify math correct)

---

## Risk Mitigation

### Risk 1: No Devnet Pools Available
**Mitigation:**
- Option A: Create pool using Orca SDK (requires permissions)
- Option B: Switch to Raydium CLMM (more permissionless)
- Option C: Use Meteora DLMM (fully permissionless)
- Option D: Continue with stubs, test on mainnet with real SOL

### Risk 2: CPI Compute Unit Limits
**Mitigation:**
- Use `compute_budget` instruction to increase limit
- Optimize account validations
- Split operations across multiple transactions if needed

### Risk 3: Price Oracle Missing
**Mitigation:**
- Use Orca's internal sqrt_price for now
- Week 8: Integrate Pyth price oracle
- Fallback: Use Switchboard or Chainlink

---

## Next Phase: Week 6

After completing Week 5, move to:
1. **Compute optimization** - Target <150k CU per operation
2. **Auto-rebalancing** - Reposition when price moves out of range
3. **Slippage protection** - Dynamic slippage based on pool depth
4. **Position monitoring** - Off-chain service to track yields
5. **Security review** - Audit Orca CPI interactions

---

## Support Resources

- Orca Docs: https://orca-so.github.io/whirlpools/
- Orca SDK Examples: https://github.com/orca-so/whirlpools/tree/main/sdk/tests
- Anchor CPI Guide: https://www.anchor-lang.com/docs/cross-program-invocations
- Devnet USDC Faucet: https://spl-token-faucet.com/

## Quick Reference Commands

```bash
# Build and deploy
anchor build && anchor deploy --provider.cluster devnet

# Run tests
anchor test --skip-local-validator

# Check devnet balance
solana balance --url devnet

# Get devnet SOL
solana airdrop 5 --url devnet

# Discover pools
npm run discover-pools

# Create test pool (if needed)
npm run create-pool
```

---

**Status:** Ready to Start ✅  
**Estimated Completion:** 5-7 days  
**Dependencies:** None (all prerequisites met)  
**Blockers:** None identified
