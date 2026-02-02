use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

/// Execute payment using a burner wallet (privacy-preserving)
/// After payment, burner is marked as used and cannot be reused
#[derive(Accounts)]
pub struct PayWithBurner<'info> {
    #[account(
        mut,
        has_one = vault @ ZCrescaError::Unauthorized,
        constraint = burner.status == 0 @ ZCrescaError::BurnerInactive,
    )]
    pub burner: Account<'info, BurnerWallet>,
    
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,
    
    /// Vault's payment token account (source)
    #[account(mut)]
    pub vault_payment_account: Account<'info, TokenAccount>,
    
    /// Merchant's payment token account (destination)
    #[account(mut)]
    pub merchant_account: Account<'info, TokenAccount>,
    
    /// Vault owner (signs the payment)
    #[account(constraint = vault.owner == owner.key() @ ZCrescaError::Unauthorized)]
    pub owner: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<PayWithBurner>,
    amount: u64,
) -> Result<()> {
    let burner = &mut ctx.accounts.burner;
    let vault = &mut ctx.accounts.vault;
    
    msg!("💳 Paying with burner wallet");
    msg!("   Burner: {}", burner.key());
    msg!("   Amount: {}", amount);
    msg!("   Merchant: {}", ctx.accounts.merchant_account.owner);
    
    // Validate burner can be used
    burner_wallet::validate_burner_active(
        burner,
        &ctx.accounts.merchant_account.owner,
        amount,
    )?;
    
    // Transfer tokens to merchant
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_payment_account.to_account_info(),
        to: ctx.accounts.merchant_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    token::transfer(cpi_ctx, amount)?;
    
    // Update burner and vault balances
    burner.allocated_amount = burner.allocated_amount
        .checked_sub(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    // Mark burner as used (one-time use)
    burner_wallet::mark_burner_used(burner)?;
    
    // Update vault stats
    vault.total_payments = vault.total_payments
        .checked_add(1)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("✅ Payment completed via burner");
    msg!("   Burner status: used (cannot be reused)");
    
    Ok(())
}
