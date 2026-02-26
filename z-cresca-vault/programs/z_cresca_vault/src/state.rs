use anchor_lang::prelude::*;

#[account]
pub struct CreditVault {
    pub owner: Pubkey,                    // User's main wallet
    pub collateral_amount: u64,           // USDC deposited
    pub collateral_token_mint: Pubkey,    // USDC mint address
    pub credit_limit: u64,                // Max borrowing capacity
    pub outstanding_balance: u64,         // Current debt
    pub lp_position_nft: Pubkey,          // Hyperion position NFT
    pub yield_earned: u64,                // Accumulated fees
    pub interest_paid: u64,               // Total interest charged
    pub last_update_slot: u64,            // For time-based calculations
    pub active: bool,                     // Can this vault be used?
    pub ltv_ratio: u16,                   // Basis points (150 = 1.5x leverage)
    pub bump: u8,                         // PDA bump seed
}

#[account]
pub struct GlobalState {
    pub authority: Pubkey,                // Admin/governance
    pub total_collateral: u64,            // Total across all users
    pub total_credit_issued: u64,         // Total outstanding
    pub default_ltv: u16,                 // 150 basis points = 1.5x
    pub base_interest_rate: u16,          // Annual, basis points
    pub treasury: Pubkey,                 // Protocol fees
    pub paused: bool,                     // Emergency stop
}