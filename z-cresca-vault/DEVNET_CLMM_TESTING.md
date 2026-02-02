# Devnet CLMM Integration Testing Guide

## Overview
This guide walks through testing Z-Cresca vault integration with CLMM protocols on Solana devnet.

## Available CLMM Options

### 1. Orca Whirlpools (Recommended)
**Why Orca:**
- ✅ Most mature CLMM on Solana
- ✅ Best documentation and SDK
- ✅ Active devnet deployment
- ✅ TypeScript SDK: `@orca-so/whirlpools-sdk`
- ✅ Proven track record (used by major protocols)

**Program ID (Mainnet & Devnet):**
```
whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc
```

**Key Accounts:**
- USDC-SOL Pool (Devnet): TBD (need to discover)
- Position Mint: Unique NFT per position
- Tick Array: Price range data

### 2. Raydium CLMM
**Program ID:**
```
CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK
```

**Pros:**
- Good liquidity on mainnet
- Active development

**Cons:**
- Less mature than Orca
- Documentation not as comprehensive

### 3. Meteora DLMM (Dynamic Liquidity Market Maker)
**Program ID:**
```
LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo
```

**Pros:**
- Innovative dynamic fee model
- Good for volatile pairs

**Cons:**
- Different mechanics from standard CLMM
- Would require separate integration

## Integration Plan: Orca Whirlpools

### Phase 1: SDK Installation
```bash
cd z-cresca-vault
npm install @orca-so/whirlpools-sdk @orca-so/common-sdk
```

### Phase 2: Discover Devnet Pools
```typescript
// File: scripts/discover-pools.ts
import { WhirlpoolContext, ORCA_WHIRLPOOL_PROGRAM_ID, buildWhirlpoolClient } from "@orca-so/whirlpools-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Circle USDC devnet
const WRAPPED_SOL = "So11111111111111111111111111111111111111112";

async function discoverPools() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const provider = AnchorProvider.env();
  
  const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
  const client = buildWhirlpoolClient(ctx);
  
  // Find USDC-SOL pool
  const pools = await client.getPools([
    { tokenA: new PublicKey(DEVNET_USDC), tokenB: new PublicKey(WRAPPED_SOL) }
  ]);
  
  console.log("Found pools:", pools);
  
  for (const pool of pools) {
    const data = await pool.getData();
    console.log("Pool:", pool.getAddress().toBase58());
    console.log("  Token A:", data.tokenMintA.toBase58());
    console.log("  Token B:", data.tokenMintB.toBase58());
    console.log("  Fee Rate:", data.feeRate / 100, "%");
    console.log("  Liquidity:", data.liquidity.toString());
  }
}

discoverPools().catch(console.error);
```

### Phase 3: Implement CPI to Orca

Update `defi/hyperion.rs` (rename to `defi/orca.rs`):

```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::Instruction,
    program::invoke_signed,
};
use crate::state::*;
use crate::errors::*;

/// Orca Whirlpool Program ID
pub const ORCA_WHIRLPOOL_PROGRAM_ID: Pubkey = pubkey!("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");

/// Open a new position in Orca Whirlpool
pub fn open_position(
    vault: &mut CreditVault,
    pool: &AccountInfo,
    position_mint: &AccountInfo,
    position_token_account: &AccountInfo,
    tick_lower_index: i32,
    tick_upper_index: i32,
) -> Result<Pubkey> {
    msg!("🌊 Opening Orca Whirlpool position");
    
    // Build open_position instruction
    let ix = build_open_position_ix(
        pool.key(),
        position_mint.key(),
        position_token_account.key(),
        tick_lower_index,
        tick_upper_index,
    )?;
    
    // CPI to Orca program
    let accounts = vec![
        pool.clone(),
        position_mint.clone(),
        position_token_account.clone(),
    ];
    
    invoke_signed(&ix, &accounts, &[])?;
    
    msg!("✅ Position opened: {}", position_mint.key());
    Ok(*position_mint.key)
}

/// Increase liquidity in existing position
pub fn increase_liquidity(
    vault: &CreditVault,
    position: &AccountInfo,
    position_token_account: &AccountInfo,
    token_owner_account_a: &AccountInfo,
    token_owner_account_b: &AccountInfo,
    token_vault_a: &AccountInfo,
    token_vault_b: &AccountInfo,
    liquidity_amount: u128,
    token_max_a: u64,
    token_max_b: u64,
) -> Result<()> {
    msg!("➕ Increasing liquidity");
    msg!("   Amount: {}", liquidity_amount);
    
    // Build increase_liquidity instruction
    let ix = build_increase_liquidity_ix(
        position.key(),
        position_token_account.key(),
        token_owner_account_a.key(),
        token_owner_account_b.key(),
        token_vault_a.key(),
        token_vault_b.key(),
        liquidity_amount,
        token_max_a,
        token_max_b,
    )?;
    
    let accounts = vec![
        position.clone(),
        position_token_account.clone(),
        token_owner_account_a.clone(),
        token_owner_account_b.clone(),
        token_vault_a.clone(),
        token_vault_b.clone(),
    ];
    
    invoke_signed(&ix, &accounts, &[])?;
    
    msg!("✅ Liquidity increased");
    Ok(())
}

/// Collect fees from position
pub fn collect_fees(
    vault: &CreditVault,
    position: &AccountInfo,
    position_token_account: &AccountInfo,
    token_owner_account_a: &AccountInfo,
    token_owner_account_b: &AccountInfo,
    token_vault_a: &AccountInfo,
    token_vault_b: &AccountInfo,
) -> Result<(u64, u64)> {
    msg!("💰 Collecting Orca fees");
    
    // Build collect_fees instruction
    let ix = build_collect_fees_ix(
        position.key(),
        position_token_account.key(),
        token_owner_account_a.key(),
        token_owner_account_b.key(),
        token_vault_a.key(),
        token_vault_b.key(),
    )?;
    
    let accounts = vec![
        position.clone(),
        position_token_account.clone(),
        token_owner_account_a.clone(),
        token_owner_account_b.clone(),
        token_vault_a.clone(),
        token_vault_b.clone(),
    ];
    
    invoke_signed(&ix, &accounts, &[])?;
    
    // Parse fees from transaction logs
    let fees_a = 0; // TODO: Parse from return data
    let fees_b = 0;
    
    msg!("✅ Fees collected: {} / {}", fees_a, fees_b);
    Ok((fees_a, fees_b))
}

// Helper functions to build Orca instructions
fn build_open_position_ix(
    pool: &Pubkey,
    position_mint: &Pubkey,
    position_token_account: &Pubkey,
    tick_lower_index: i32,
    tick_upper_index: i32,
) -> Result<Instruction> {
    // TODO: Implement Orca instruction builder
    // Reference: https://github.com/orca-so/whirlpools/blob/main/programs/whirlpool/src/instructions/open_position.rs
    todo!("Build open_position instruction")
}

fn build_increase_liquidity_ix(
    position: &Pubkey,
    position_token_account: &Pubkey,
    token_owner_account_a: &Pubkey,
    token_owner_account_b: &Pubkey,
    token_vault_a: &Pubkey,
    token_vault_b: &Pubkey,
    liquidity_amount: u128,
    token_max_a: u64,
    token_max_b: u64,
) -> Result<Instruction> {
    todo!("Build increase_liquidity instruction")
}

fn build_collect_fees_ix(
    position: &Pubkey,
    position_token_account: &Pubkey,
    token_owner_account_a: &Pubkey,
    token_owner_account_b: &Pubkey,
    token_vault_a: &Pubkey,
    token_vault_b: &Pubkey,
) -> Result<Instruction> {
    todo!("Build collect_fees instruction")
}
```

### Phase 4: Devnet Testing Script

```typescript
// File: scripts/test-orca-integration.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZCrescaVault } from "../target/types/z_cresca_vault";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { 
  WhirlpoolContext, 
  buildWhirlpoolClient,
  PriceMath,
  increaseLiquidityQuoteByInputTokenWithParams
} from "@orca-so/whirlpools-sdk";
import { DecimalUtil, Percentage } from "@orca-so/common-sdk";

async function testOrcaIntegration() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = Keypair.fromSecretKey(/* your devnet wallet */);
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);
  
  const program = anchor.workspace.ZCrescaVault as Program<ZCrescaVault>;
  
  console.log("🧪 Testing Orca Whirlpool Integration");
  
  // 1. Initialize vault
  const vaultId = new anchor.BN(0);
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), wallet.publicKey.toBuffer(), vaultId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  
  await program.methods
    .initializeVault(vaultId)
    .accounts({
      vault: vaultPda,
      owner: wallet.publicKey,
      // ... other accounts
    })
    .rpc();
  
  console.log("✅ Vault initialized:", vaultPda.toBase58());
  
  // 2. Deposit collateral
  const collateralAmount = new anchor.BN(1000_000_000); // 1000 USDC
  await program.methods
    .depositCollateral(collateralAmount)
    .accounts({
      vault: vaultPda,
      // ... other accounts
    })
    .rpc();
  
  console.log("✅ Deposited 1000 USDC collateral");
  
  // 3. Open Orca Whirlpool position
  const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
  const client = buildWhirlpoolClient(ctx);
  
  const poolAddress = new PublicKey("POOL_ADDRESS_HERE"); // From discovery script
  const whirlpool = await client.getPool(poolAddress);
  const whirlpoolData = await whirlpool.getData();
  
  // Calculate tick range (±10% from current price)
  const currentPrice = PriceMath.sqrtPriceX64ToPrice(
    whirlpoolData.sqrtPrice,
    6, // USDC decimals
    9  // SOL decimals
  );
  
  const lowerPrice = currentPrice.mul(new Decimal(0.9));
  const upperPrice = currentPrice.mul(new Decimal(1.1));
  
  const tickLower = PriceMath.priceToTickIndex(lowerPrice, 6, 9);
  const tickUpper = PriceMath.priceToTickIndex(upperPrice, 6, 9);
  
  console.log(`Opening position: ${tickLower} to ${tickUpper}`);
  
  // Call Z-Cresca deposit_to_clmm instruction
  await program.methods
    .depositToClmm(
      collateralAmount.divn(2), // 500 USDC
      0, // SOL amount (will be calculated)
      new anchor.BN(tickLower),
      new anchor.BN(tickUpper)
    )
    .accounts({
      vault: vaultPda,
      // ... Orca accounts
    })
    .rpc();
  
  console.log("✅ Orca position created");
  
  // 4. Simulate time passing and harvest yield
  await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
  
  await program.methods
    .harvestYield()
    .accounts({
      vault: vaultPda,
      // ... accounts
    })
    .rpc();
  
  console.log("✅ Yield harvested");
  
  // 5. Verify vault state
  const vaultAccount = await program.account.creditVault.fetch(vaultPda);
  console.log("Final vault state:");
  console.log("  Collateral:", vaultAccount.collateralAmount.toNumber() / 1e6, "USDC");
  console.log("  Yield Earned:", vaultAccount.yieldEarned.toNumber() / 1e6, "USDC");
  console.log("  Credit Limit:", vaultAccount.creditLimit.toNumber() / 1e6, "USDC");
  console.log("  LP Position:", vaultAccount.lpPositionNft.toBase58());
}

testOrcaIntegration().catch(console.error);
```

## Testing Checklist

### Pre-Testing
- [ ] Install Orca SDK: `npm install @orca-so/whirlpools-sdk`
- [ ] Get devnet SOL: `solana airdrop 2 --url devnet`
- [ ] Get devnet USDC from faucet
- [ ] Deploy Z-Cresca program to devnet: `anchor deploy --provider.cluster devnet`

### Discovery Phase
- [ ] Run pool discovery script
- [ ] Verify USDC-SOL pool exists on devnet
- [ ] Document pool address and fee tier
- [ ] Check pool liquidity (should be >$1000)

### Integration Testing
- [ ] Initialize test vault
- [ ] Deposit 1000 USDC collateral
- [ ] Open Orca position with ±10% price range
- [ ] Verify position NFT stored in vault
- [ ] Make test payment to verify credit works
- [ ] Wait for trading fees to accrue
- [ ] Harvest yield and verify yield_earned increases
- [ ] Withdraw liquidity partially
- [ ] Verify credit limit recalculated correctly

### Performance Metrics
- [ ] Transaction costs: Should be <0.01 SOL per operation
- [ ] Position creation: <5 seconds
- [ ] Yield harvest: <3 seconds
- [ ] Slippage: <0.5% on deposits

### Edge Cases
- [ ] Test with zero liquidity withdrawal
- [ ] Test harvest with no fees accrued
- [ ] Test rebalancing when price moves out of range
- [ ] Test emergency withdrawal when pool paused

## Next Steps

1. **Week 5**: Implement full Orca integration
   - Complete CPI instruction builders
   - Add slippage protection
   - Test on devnet

2. **Week 6**: Optimize and secure
   - Add price oracle integration (Pyth)
   - Implement rebalancing logic
   - Security audit of CPI calls

3. **Week 7**: Jupiter integration
   - Add SOL↔USDC swapping
   - Implement optimal routing
   - Test with real trades

## Resources

- [Orca Whirlpools Docs](https://orca-so.gitbook.io/orca-developer-portal/whirlpools/interacting-with-the-protocol)
- [Orca SDK GitHub](https://github.com/orca-so/whirlpools)
- [Solana Cookbook - CPI](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocation)
- [Anchor CPI Examples](https://book.anchor-lang.com/anchor_in_depth/CPIs.html)
