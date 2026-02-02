use anchor_lang::prelude::*;

/// User's credit vault account
#[account]
pub struct CreditVault {
    /// Vault owner (user's main wallet)
    pub owner: Pubkey,
    
    /// Unique vault ID for this user
    pub vault_id: u64,
    
    /// Token mint for collateral (USDC, SOL, etc.)
    pub collateral_token_mint: Pubkey,
    
    /// Amount of collateral deposited (in token units)
    pub collateral_amount: u64,
    
    /// Maximum credit available (calculated from collateral + yield)
    pub credit_limit: u64,
    
    /// Current outstanding balance (borrowed amount)
    pub outstanding_balance: u64,
    
    /// Total yield earned from DeFi positions
    pub yield_earned: u64,
    
    /// Total interest paid on credit
    pub interest_paid: u64,
    
    /// Hyperion CLMM position NFT address
    pub lp_position_nft: Pubkey,
    
    /// Liquidity amount in CLMM position
    pub lp_liquidity: u128,
    
    /// Last time interest was accrued
    pub last_interest_update: i64,
    
    /// Last time yield was harvested
    pub last_yield_harvest: i64,
    
    /// Vault creation timestamp
    pub created_at: i64,
    
    /// LTV ratio for this vault (basis points)
    pub ltv_ratio: u16,
    
    /// Current interest rate (basis points, APR)
    pub current_interest_rate: u16,
    
    /// Daily spending limit
    pub daily_limit: u64,
    
    /// Amount spent today
    pub daily_spent: u64,
    
    /// Last daily reset timestamp
    pub last_daily_reset: i64,
    
    /// Is vault active?
    pub active: bool,
    
    /// Total number of payments made
    pub total_payments: u64,
    
    /// Total volume of payments
    pub total_payment_volume: u64,
    
    /// Burner wallet currently assigned (for privacy)
    pub current_burner: Pubkey,
    
    /// Burner wallet rotation counter
    pub burner_rotation_count: u32,
    
    /// PDA bump seed
    pub bump: u8,
}

impl CreditVault {
    pub const LEN: usize = 8 + // discriminator
        32 +  // owner
        8 +   // vault_id
        32 +  // collateral_token_mint
        8 +   // collateral_amount
        8 +   // credit_limit
        8 +   // outstanding_balance
        8 +   // yield_earned
        8 +   // interest_paid
        32 +  // lp_position_nft
        16 +  // lp_liquidity
        8 +   // last_interest_update
        8 +   // last_yield_harvest
        8 +   // created_at
        2 +   // ltv_ratio
        2 +   // current_interest_rate
        8 +   // daily_limit
        8 +   // daily_spent
        8 +   // last_daily_reset
        1 +   // active
        8 +   // total_payments
        8 +   // total_payment_volume
        32 +  // current_burner
        4 +   // burner_rotation_count
        1;    // bump

    /// Calculate available credit (limit - outstanding)
    pub fn available_credit(&self) -> u64 {
        self.credit_limit.saturating_sub(self.outstanding_balance)
    }

    /// Calculate utilization ratio (basis points)
    pub fn utilization_ratio(&self) -> u64 {
        if self.credit_limit == 0 {
            return 0;
        }
        (self.outstanding_balance as u128)
            .checked_mul(10_000)
            .unwrap()
            .checked_div(self.credit_limit as u128)
            .unwrap() as u64
    }

    /// Calculate health factor (basis points)
    /// Health = (Collateral Value * LTV) / Outstanding Balance
    pub fn health_factor(&self, collateral_value: u64) -> u64 {
        if self.outstanding_balance == 0 {
            return u64::MAX;
        }
        
        let max_borrow = (collateral_value as u128)
            .checked_mul(self.ltv_ratio as u128)
            .unwrap()
            .checked_div(10_000)
            .unwrap() as u64;
        
        (max_borrow as u128)
            .checked_mul(10_000)
            .unwrap()
            .checked_div(self.outstanding_balance as u128)
            .unwrap() as u64
    }

    /// Check if vault needs liquidation
    pub fn needs_liquidation(&self, collateral_value: u64, threshold: u64) -> bool {
        self.health_factor(collateral_value) < threshold
    }

    /// Reset daily spending if new day
    pub fn reset_daily_spending_if_needed(&mut self, current_timestamp: i64) {
        let seconds_since_reset = current_timestamp - self.last_daily_reset;
        if seconds_since_reset >= 86_400 { // 24 hours
            self.daily_spent = 0;
            self.last_daily_reset = current_timestamp;
        }
    }
}

/// Payment authorization result
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AuthorizationResult {
    pub approved: bool,
    pub reason: String,
    pub available_credit: u64,
    pub new_outstanding: u64,
}
