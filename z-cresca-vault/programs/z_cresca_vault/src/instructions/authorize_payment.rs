use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct AuthorizePayment<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        constraint = vault.active @ ZCrescaError::VaultInactive
    )]
    pub vault: Account<'info, CreditVault>,
    
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        constraint = !global_state.paused @ ZCrescaError::ProtocolPaused
    )]
    pub global_state: Account<'info, GlobalState>,
    
    /// CHECK: Merchant receiving payment
    pub merchant: AccountInfo<'info>,
    
    /// Relayer signing the transaction (pays gas)
    pub relayer: Signer<'info>,
}

pub fn handler(
    ctx: Context<AuthorizePayment>,
    amount: u64,
    _merchant: Pubkey,
) -> Result<bool> {
    require!(amount > 0, ZCrescaError::InvalidAmount);
    
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    // Reset daily spending if needed
    vault.reset_daily_spending_if_needed(clock.unix_timestamp);
    
    // Accrue interest before authorization
    accrue_interest_internal(vault, clock.unix_timestamp)?;
    
    // Check available credit
    let available = vault.available_credit();
    if amount > available {
        msg!("❌ Payment DECLINED: Insufficient credit");
        msg!("   Requested: {}", amount);
        msg!("   Available: {}", available);
        return Ok(false);
    }
    
    // Check daily limit
    let new_daily_total = vault
        .daily_spent
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    if new_daily_total > vault.daily_limit {
        msg!("❌ Payment DECLINED: Daily limit exceeded");
        msg!("   Daily Limit: {}", vault.daily_limit);
        msg!("   Already Spent: {}", vault.daily_spent);
        return Ok(false);
    }
    
    // Authorize payment
    vault.outstanding_balance = vault
        .outstanding_balance
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.daily_spent = new_daily_total;
    vault.total_payments = vault
        .total_payments
        .checked_add(1)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.total_payment_volume = vault
        .total_payment_volume
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("✅ Payment APPROVED");
    msg!("   Amount: {}", amount);
    msg!("   New Outstanding: {}", vault.outstanding_balance);
    msg!("   Available Credit: {}", vault.available_credit());
    msg!("   Utilization: {}%", vault.utilization_ratio() as f64 / 100.0);
    
    Ok(true)
}

/// Internal function to accrue interest
fn accrue_interest_internal(vault: &mut CreditVault, current_timestamp: i64) -> Result<()> {
    if vault.outstanding_balance == 0 {
        vault.last_interest_update = current_timestamp;
        return Ok(());
    }
    
    let seconds_elapsed = current_timestamp
        .checked_sub(vault.last_interest_update)
        .ok_or(ZCrescaError::InvalidTimestamp)?;
    
    if seconds_elapsed <= 0 {
        return Ok(());
    }
    
    // Calculate interest rate based on utilization
    let utilization = vault.utilization_ratio();
    let variable_rate = (utilization as u128)
        .checked_mul(INTEREST_MULTIPLIER as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(BASIS_POINTS as u128)
        .ok_or(ZCrescaError::MathOverflow)? as u64;
    
    let total_rate = vault.current_interest_rate
        .checked_add(variable_rate as u16)
        .ok_or(ZCrescaError::MathOverflow)?
        .min(MAX_INTEREST_RATE);
    
    vault.current_interest_rate = total_rate;
    
    // Calculate interest: principal * rate * time / (seconds_per_year * BASIS_POINTS)
    let interest = (vault.outstanding_balance as u128)
        .checked_mul(total_rate as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_mul(seconds_elapsed as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(SECONDS_PER_YEAR as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(BASIS_POINTS as u128)
        .ok_or(ZCrescaError::MathOverflow)? as u64;
    
    vault.outstanding_balance = vault
        .outstanding_balance
        .checked_add(interest)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.interest_paid = vault
        .interest_paid
        .checked_add(interest)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.last_interest_update = current_timestamp;
    
    Ok(())
}
