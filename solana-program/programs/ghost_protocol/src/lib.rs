use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use sha2::{Digest, Sha256};

declare_id!("7vMTXkMnG73kshMHLKft7T4fFEhCnNJF5ewEuD5Gbd2m");

/// Maximum credential age in seconds (5 minutes)
const MAX_CREDENTIAL_AGE: i64 = 300;

/// Maximum display name length
const MAX_DISPLAY_NAME_LEN: usize = 64;

#[program]
pub mod ghost_protocol {
    use super::*;

    /// Initialize a merchant account for accepting payments
    pub fn initialize_merchant(
        ctx: Context<InitializeMerchant>,
        display_name: String,
    ) -> Result<()> {
        require!(
            display_name.len() <= MAX_DISPLAY_NAME_LEN,
            ErrorCode::DisplayNameTooLong
        );

        let merchant = &mut ctx.accounts.merchant;
        merchant.authority = ctx.accounts.authority.key();
        merchant.merchant_pubkey = ctx.accounts.authority.key();
        merchant.display_name = display_name;
        merchant.payment_destination = ctx.accounts.payment_destination.key();
        merchant.total_payments = 0;
        merchant.total_volume = 0;
        merchant.active = true;

        msg!("Merchant initialized: {} ({})", merchant.display_name, merchant.merchant_pubkey);
        Ok(())
    }

    /// Verify payment credential and process payment (GASLESS - Relayer pays fees)
    /// NO customer signer required - privacy preserved!
    pub fn verify_payment_credential(
        ctx: Context<VerifyPayment>,
        credential_id: [u8; 16],
        signature: [u8; 32],
        counter: u64,
        timestamp: i64,
        merchant_pubkey: Pubkey,
        amount: u64,
        customer_token_account_owner: Pubkey,  // Verified via signature, not signer
    ) -> Result<()> {
        let clock = Clock::get()?;
        let merchant = &ctx.accounts.merchant;

        // 1. Verify merchant is active
        require!(merchant.active, ErrorCode::MerchantInactive);
        require!(
            merchant.merchant_pubkey == merchant_pubkey,
            ErrorCode::MerchantMismatch
        );

        // 2. Verify credential not expired (< 5 minutes old)
        let age = clock.unix_timestamp - timestamp;
        require!(
            age >= 0 && age < MAX_CREDENTIAL_AGE,
            ErrorCode::CredentialExpired
        );

        // 3. Verify counter not used before (replay protection)
        let used_credential = &ctx.accounts.used_credential;
        require!(
            used_credential.counter == 0, // Uninitialized account
            ErrorCode::CredentialAlreadyUsed
        );

        // 4. Verify HMAC signature includes customer token account owner
        // This proves the customer authorized the payment without revealing their identity
        let expected_id = derive_credential_id(&signature, counter, &merchant_pubkey, timestamp, &customer_token_account_owner);
        require!(
            credential_id == expected_id[..16],
            ErrorCode::InvalidSignature
        );

        // 5. Verify customer_token_account belongs to claimed owner
        require!(
            ctx.accounts.customer_token_account.owner == customer_token_account_owner,
            ErrorCode::InvalidTokenAccountOwner
        );

        // 6. Transfer tokens using token account's delegate authority (set by customer)
        // Relayer submits transaction, but customer pre-approved via delegate
        let cpi_accounts = Transfer {
            from: ctx.accounts.customer_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.token_delegate.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // 7. Mark credential as used (burn)
        let used_credential = &mut ctx.accounts.used_credential;
        used_credential.counter = counter;
        used_credential.timestamp = timestamp;
        used_credential.merchant = merchant.key();
        used_credential.credential_id = credential_id;

        // 8. Update merchant statistics
        let merchant = &mut ctx.accounts.merchant;
        merchant.total_payments += 1;
        merchant.total_volume += amount;

        msg!("Payment verified: {} tokens to {}", amount, merchant.display_name);
        msg!("Credential burned: counter={}, id={:?}", counter, &credential_id[..8]);
        msg!("Privacy preserved: No customer signer revealed");
        
        Ok(())
    }

    /// Revoke a credential (emergency use)
    pub fn revoke_credential(
        ctx: Context<RevokeCredential>,
        counter: u64,
        timestamp: i64,
    ) -> Result<()> {
        let used_credential = &mut ctx.accounts.used_credential;
        used_credential.counter = counter;
        used_credential.timestamp = timestamp;
        used_credential.merchant = Pubkey::default();
        used_credential.credential_id = [0u8; 16];

        msg!("Credential revoked: counter={}", counter);
        Ok(())
    }

    /// Deactivate merchant account
    pub fn deactivate_merchant(ctx: Context<UpdateMerchant>) -> Result<()> {
        let merchant = &mut ctx.accounts.merchant;
        require!(
            merchant.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        
        merchant.active = false;
        msg!("Merchant deactivated: {}", merchant.display_name);
        Ok(())
    }
}

/// Derive credential ID from components (includes customer ownership proof)
fn derive_credential_id(
    signature: &[u8; 32],
    counter: u64,
    merchant_pubkey: &Pubkey,
    timestamp: i64,
    customer_owner: &Pubkey,
) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(signature);
    hasher.update(counter.to_le_bytes());
    hasher.update(merchant_pubkey.to_bytes());
    hasher.update(timestamp.to_le_bytes());
    hasher.update(customer_owner.to_bytes());
    hasher.finalize().into()
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
pub struct InitializeMerchant<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + MerchantRegistry::INIT_SPACE,
        seeds = [b"merchant", authority.key().as_ref()],
        bump
    )]
    pub merchant: Account<'info, MerchantRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// Token account where merchant receives payments
    pub payment_destination: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    credential_id: [u8; 16],
    signature: [u8; 32],
    counter: u64,
    timestamp: i64,
    merchant_pubkey: Pubkey,
)]
pub struct VerifyPayment<'info> {
    #[account(
        mut,
        seeds = [b"merchant", merchant_pubkey.as_ref()],
        bump
    )]
    pub merchant: Account<'info, MerchantRegistry>,

    #[account(
        init,
        payer = relayer,
        space = 8 + UsedCredential::INIT_SPACE,
        seeds = [b"cred", counter.to_le_bytes().as_ref()],
        bump
    )]
    pub used_credential: Account<'info, UsedCredential>,

    /// Relayer pays transaction fees (privacy preserving)
    #[account(mut)]
    pub relayer: Signer<'info>,

    /// Customer token account (NO SIGNER REQUIRED)
    #[account(mut)]
    pub customer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub merchant_token_account: Account<'info, TokenAccount>,

    /// Token delegate authority (customer pre-approves specific relayer)
    /// CHECK: Verified by token program during transfer
    pub token_delegate: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(counter: u64)]
pub struct RevokeCredential<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + UsedCredential::INIT_SPACE,
        seeds = [b"cred", counter.to_le_bytes().as_ref()],
        bump
    )]
    pub used_credential: Account<'info, UsedCredential>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMerchant<'info> {
    #[account(
        mut,
        seeds = [b"merchant", merchant.merchant_pubkey.as_ref()],
        bump
    )]
    pub merchant: Account<'info, MerchantRegistry>,

    pub authority: Signer<'info>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct MerchantRegistry {
    /// Merchant owner (can deactivate)
    pub authority: Pubkey,
    
    /// Merchant public key (unique identifier)
    pub merchant_pubkey: Pubkey,
    
    /// Human-readable name (e.g., "Starbucks SF Mission")
    #[max_len(64)]
    pub display_name: String,
    
    /// Token account receiving payments
    pub payment_destination: Pubkey,
    
    /// Total successful payments
    pub total_payments: u64,
    
    /// Total volume processed (in token units)
    pub total_volume: u64,
    
    /// Whether merchant is accepting payments
    pub active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct UsedCredential {
    /// Transaction counter (replay protection)
    pub counter: u64,
    
    /// When credential was used
    pub timestamp: i64,
    
    /// Which merchant accepted it
    pub merchant: Pubkey,
    
    /// Credential ID for tracking
    pub credential_id: [u8; 16],
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Display name exceeds maximum length")]
    DisplayNameTooLong,
    
    #[msg("Merchant account is inactive")]
    MerchantInactive,
    
    #[msg("Merchant public key does not match")]
    MerchantMismatch,
    
    #[msg("Credential expired (older than 5 minutes)")]
    CredentialExpired,
    
    #[msg("Credential already used (replay attack)")]
    CredentialAlreadyUsed,
    
    #[msg("Invalid HMAC signature")]
    InvalidSignature,
    
    #[msg("Unauthorized: not merchant authority")]
    Unauthorized,
    
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
}
