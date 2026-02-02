use anchor_lang::prelude::*;

/// Global protocol state (singleton)
#[account]
pub struct GlobalState {
    /// Protocol authority/admin
    pub authority: Pubkey,
    
    /// Total collateral across all vaults
    pub total_collateral: u64,
    
    /// Total credit issued across all vaults
    pub total_credit_issued: u64,
    
    /// Total outstanding balance across all vaults
    pub total_outstanding: u64,
    
    /// Default LTV ratio (basis points, 150 = 1.5x)
    pub default_ltv: u16,
    
    /// Base interest rate (basis points, 200 = 2% APR)
    pub base_interest_rate: u16,
    
    /// Protocol treasury for fees
    pub treasury: Pubkey,
    
    /// Emergency pause flag
    pub paused: bool,
    
    /// Total vaults created
    pub total_vaults: u64,
    
    /// Total yield harvested across all vaults
    pub total_yield_harvested: u64,
    
    /// Total interest collected
    pub total_interest_collected: u64,
    
    /// Protocol creation timestamp
    pub created_at: i64,
    
    /// Last update timestamp
    pub last_update: i64,
    
    /// PDA bump
    pub bump: u8,
}

impl GlobalState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 +  // total_collateral
        8 +  // total_credit_issued
        8 +  // total_outstanding
        2 +  // default_ltv
        2 +  // base_interest_rate
        32 + // treasury
        1 +  // paused
        8 +  // total_vaults
        8 +  // total_yield_harvested
        8 +  // total_interest_collected
        8 +  // created_at
        8 +  // last_update
        1;   // bump
}
