use anchor_lang::prelude::*;

/// Orca Whirlpool Program ID (mainnet and devnet)
declare_id!("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");

pub const ORCA_WHIRLPOOL_PROGRAM_ID: Pubkey = ID;

/// Devnet Test Pool: SOL-AezJ (20% fee tier, tick spacing 64)
/// Note: Not USDC-SOL (doesn't exist on devnet), but functional for testing CPI
/// Pool has liquidity: 1,001,202,545
/// Token A: So11111111111111111111111111111111111111112 (SOL)
/// Token B: AezJ18fB5Dp3Rk2Z4nWYPKYf6Z1BoixSa2FxfL8v2vnd
pub fn get_devnet_pool() -> Pubkey {
    Pubkey::try_from("AdFMrN9XVBxPuwhsLnmrkX7fs7XV6V9ZqZMvN2dXoroC").unwrap()
}

/// Mainnet USDC-SOL Pool (0.3% fee tier)
/// TODO: Update before mainnet deployment
pub fn get_mainnet_pool() -> Pubkey {
    Pubkey::default() // Placeholder
}

/// Pool fee tier basis points
pub const FEE_TIER: u16 = 3000; // 0.3% = 30 basis points

/// Tick spacing for 0.3% fee tier
pub const TICK_SPACING: u16 = 64;

/// Minimum liquidity for positions
pub const MIN_LIQUIDITY: u128 = 1000;

/// Maximum slippage tolerance (1% = 100 basis points)
pub const MAX_SLIPPAGE_BPS: u16 = 100;
