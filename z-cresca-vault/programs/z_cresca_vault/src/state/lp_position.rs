use anchor_lang::prelude::*;

/// Liquidity Provider position metadata
#[account]
pub struct LPPosition {
    /// Vault that owns this position
    pub vault: Pubkey,
    
    /// Hyperion position NFT address
    pub position_nft: Pubkey,
    
    /// Pool address
    pub pool: Pubkey,
    
    /// Token0 mint (e.g., USDC)
    pub token0_mint: Pubkey,
    
    /// Token1 mint (e.g., SOL)
    pub token1_mint: Pubkey,
    
    /// Liquidity amount
    pub liquidity: u128,
    
    /// Lower price tick
    pub price_lower: u64,
    
    /// Upper price tick
    pub price_upper: u64,
    
    /// Uncollected fees (token0)
    pub uncollected_fees_token0: u64,
    
    /// Uncollected fees (token1)
    pub uncollected_fees_token1: u64,
    
    /// Total fees collected (token0)
    pub total_fees_token0: u64,
    
    /// Total fees collected (token1)
    pub total_fees_token1: u64,
    
    /// Position opened timestamp
    pub opened_at: i64,
    
    /// Last fee collection timestamp
    pub last_harvest: i64,
    
    /// Is position active?
    pub active: bool,
    
    /// PDA bump
    pub bump: u8,
}

impl LPPosition {
    pub const LEN: usize = 8 + // discriminator
        32 +  // vault
        32 +  // position_nft
        32 +  // pool
        32 +  // token0_mint
        32 +  // token1_mint
        16 +  // liquidity
        8 +   // price_lower
        8 +   // price_upper
        8 +   // uncollected_fees_token0
        8 +   // uncollected_fees_token1
        8 +   // total_fees_token0
        8 +   // total_fees_token1
        8 +   // opened_at
        8 +   // last_harvest
        1 +   // active
        1;    // bump
}
