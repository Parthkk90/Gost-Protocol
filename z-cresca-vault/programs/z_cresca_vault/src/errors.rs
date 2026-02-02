use anchor_lang::prelude::*;

#[error_code]
pub enum ZCrescaError {
    #[msg("Insufficient credit available for this transaction")]
    InsufficientCredit,
    
    #[msg("Collateral value too low for requested credit line")]
    InsufficientCollateral,
    
    #[msg("Vault health factor below safe threshold")]
    UnhealthyVault,
    
    #[msg("Cannot withdraw collateral while debt outstanding")]
    OutstandingDebt,
    
    #[msg("Daily spending limit exceeded")]
    DailyLimitExceeded,
    
    #[msg("Invalid LTV ratio (must be 100-200)")]
    InvalidLTV,
    
    #[msg("Invalid interest rate")]
    InvalidInterestRate,
    
    #[msg("Vault is inactive")]
    VaultInactive,
    
    #[msg("Protocol is paused")]
    ProtocolPaused,
    
    #[msg("Unauthorized: admin only")]
    Unauthorized,
    
    #[msg("ZK proof verification failed")]
    InvalidProof,
    
    #[msg("Vault is healthy, cannot liquidate")]
    VaultHealthy,
    
    #[msg("Arithmetic overflow")]
    MathOverflow,
    
    #[msg("Timestamp error")]
    InvalidTimestamp,
    
    #[msg("Position NFT not found")]
    PositionNotFound,
    
    #[msg("Yield harvest failed")]
    HarvestFailed,
    
    #[msg("CLMM operation failed")]
    CLMMError,
    
    #[msg("Oracle price unavailable")]
    OracleError,
    
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    
    #[msg("Invalid price range: lower must be less than upper")]
    InvalidPriceRange,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    
    #[msg("Swap output insufficient to cover payment")]
    InsufficientSwapOutput,
    
    #[msg("No outstanding balance to pay")]
    NoOutstandingBalance,
    
    #[msg("Burner wallet is inactive")]
    BurnerInactive,
    
    #[msg("Burner wallet has expired")]
    BurnerExpired,
    
    #[msg("Burner wallet merchant mismatch")]
    BurnerMerchantMismatch,
    
    #[msg("Insufficient funds in burner wallet")]
    InsufficientBurnerFunds,
    
    #[msg("Burner wallet not yet expired")]
    BurnerNotExpired,
}
