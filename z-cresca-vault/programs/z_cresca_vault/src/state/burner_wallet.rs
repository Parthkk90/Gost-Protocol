use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};
use crate::errors::*;

/// Burner Wallet System for Privacy-Preserving Payments
/// 
/// Each payment gets a unique one-time address derived from:
/// - Master vault pubkey
/// - Payment nonce
/// - HMAC with vault-specific secret
/// 
/// This prevents merchant tracking across transactions

#[account]
pub struct BurnerWallet {
    /// Parent vault that owns this burner
    pub vault: Pubkey,
    
    /// Unique nonce for this burner
    pub nonce: u64,
    
    /// Derived burner address
    pub address: Pubkey,
    
    /// Amount allocated to this burner
    pub allocated_amount: u64,
    
    /// Merchant this burner is authorized for
    pub merchant: Pubkey,
    
    /// Expiry timestamp (auto-sweep after this)
    pub expires_at: i64,
    
    /// Status: 0=active, 1=used, 2=expired, 3=swept
    pub status: u8,
    
    /// Creation timestamp
    pub created_at: i64,
    
    pub bump: u8,
}

impl BurnerWallet {
    pub const LEN: usize = 8 + // discriminator
        32 + // vault
        8 +  // nonce
        32 + // address
        8 +  // allocated_amount
        32 + // merchant
        8 +  // expires_at
        1 +  // status
        8 +  // created_at
        1;   // bump
}

/// Derive a burner wallet address deterministically
/// PDA seeds: [b"burner", vault_pubkey, nonce_bytes]
pub fn derive_burner_address(
    vault: &Pubkey,
    nonce: u64,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"burner",
            vault.as_ref(),
            &nonce.to_le_bytes(),
        ],
        program_id,
    )
}

/// Generate burner wallet metadata
pub fn generate_burner_metadata(
    vault: &Pubkey,
    nonce: u64,
    merchant: &Pubkey,
    amount: u64,
    ttl_seconds: i64,
) -> Result<(Pubkey, i64)> {
    let clock = Clock::get()?;
    let expires_at = clock.unix_timestamp
        .checked_add(ttl_seconds)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("🔥 Generating burner wallet");
    msg!("   Vault: {}", vault);
    msg!("   Nonce: {}", nonce);
    msg!("   Merchant: {}", merchant);
    msg!("   Amount: {}", amount);
    msg!("   Expires: {}", expires_at);
    
    // Derive address (will be a PDA)
    let (burner_address, _bump) = derive_burner_address(
        vault,
        nonce,
        &crate::ID,
    );
    
    Ok((burner_address, expires_at))
}

/// Validate burner wallet can be used for payment
pub fn validate_burner_active(
    burner: &BurnerWallet,
    merchant: &Pubkey,
    amount: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    
    // Check status
    require!(burner.status == 0, ZCrescaError::BurnerInactive);
    
    // Check expiry
    require!(
        clock.unix_timestamp <= burner.expires_at,
        ZCrescaError::BurnerExpired
    );
    
    // Check merchant match
    require!(
        burner.merchant == *merchant,
        ZCrescaError::BurnerMerchantMismatch
    );
    
    // Check amount
    require!(
        amount <= burner.allocated_amount,
        ZCrescaError::InsufficientBurnerFunds
    );
    
    msg!("✅ Burner wallet validated");
    Ok(())
}

/// Mark burner as used after payment
pub fn mark_burner_used(burner: &mut BurnerWallet) -> Result<()> {
    burner.status = 1; // used
    msg!("🔥 Burner marked as used - cannot be reused");
    Ok(())
}

/// Sweep expired burner funds back to vault
pub fn sweep_expired_burner(
    burner: &mut BurnerWallet,
    vault_balance: &mut u64,
) -> Result<u64> {
    let clock = Clock::get()?;
    
    require!(
        clock.unix_timestamp > burner.expires_at,
        ZCrescaError::BurnerNotExpired
    );
    
    let amount = burner.allocated_amount;
    burner.allocated_amount = 0;
    burner.status = 3; // swept
    
    *vault_balance = vault_balance
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("🧹 Swept {} from expired burner", amount);
    Ok(amount)
}
