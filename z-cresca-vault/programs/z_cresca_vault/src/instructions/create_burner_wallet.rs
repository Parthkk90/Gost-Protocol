use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

/// Create a one-time burner wallet for a specific payment
/// This enables privacy - each payment uses a unique address
#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateBurnerWallet<'info> {
    #[account(
        mut,
        has_one = owner @ ZCrescaError::Unauthorized,
    )]
    pub vault: Account<'info, CreditVault>,
    
    #[account(
        init,
        payer = owner,
        space = BurnerWallet::LEN,
        seeds = [b"burner", vault.key().as_ref(), &nonce.to_le_bytes()],
        bump,
    )]
    pub burner: Account<'info, BurnerWallet>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateBurnerWallet>,
    nonce: u64,
    merchant: Pubkey,
    amount: u64,
    ttl_seconds: i64,
) -> Result<Pubkey> {
    let vault = &mut ctx.accounts.vault;
    let burner = &mut ctx.accounts.burner;
    let clock = Clock::get()?;
    
    msg!("🔥 Creating burner wallet");
    msg!("   Parent vault: {}", vault.key());
    msg!("   Nonce: {}", nonce);
    msg!("   Merchant: {}", merchant);
    msg!("   Amount: {}", amount);
    msg!("   TTL: {}s", ttl_seconds);
    
    // Validate amount available
    require!(
        amount <= vault.available_credit(),
        ZCrescaError::InsufficientCredit
    );
    
    // Initialize burner
    burner.vault = vault.key();
    burner.nonce = nonce;
    burner.address = burner.key();
    burner.allocated_amount = amount;
    burner.merchant = merchant;
    burner.expires_at = clock.unix_timestamp
        .checked_add(ttl_seconds)
        .ok_or(ZCrescaError::MathOverflow)?;
    burner.status = 0; // active
    burner.created_at = clock.unix_timestamp;
    burner.bump = ctx.bumps.burner;
    
    // Reserve credit in vault (not spent yet, but allocated)
    vault.outstanding_balance = vault.outstanding_balance
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("✅ Burner created: {}", burner.key());
    msg!("   Expires at: {}", burner.expires_at);
    
    Ok(burner.key())
}
