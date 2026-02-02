use anchor_lang::prelude::*;
use crate::state::*;
use crate::defi::pyth_oracle;
use crate::errors::*;
use crate::constants::*;

/// Update vault credit limit using real-time Pyth oracle prices
/// This replaces the old calculate_credit_limit with accurate pricing
#[derive(Accounts)]
pub struct UpdateCreditLimit<'info> {
    #[account(
        mut,
        has_one = owner @ ZCrescaError::Unauthorized,
    )]
    pub vault: Account<'info, CreditVault>,
    
    pub owner: Signer<'info>,
    
    /// Pyth SOL/USD price feed account
    /// CHECK: Validated by Pyth SDK
    pub sol_price_feed: AccountInfo<'info>,
}

pub fn handler(ctx: Context<UpdateCreditLimit>) -> Result<u64> {
    let vault = &mut ctx.accounts.vault;
    
    msg!("🔄 Updating credit limit with Pyth oracle");
    msg!("   Current collateral: {}", vault.collateral_amount);
    msg!("   Current yield: {}", vault.yield_earned);
    
    // Get real-time SOL price from Pyth
    let collateral_value_usd = pyth_oracle::calculate_collateral_value_usd(
        vault.collateral_amount,
        9, // SOL has 9 decimals
        &ctx.accounts.sol_price_feed,
    )?;
    
    // Calculate yield value (assume USDC yield, already in USD)
    let yield_value_usd = vault.yield_earned;
    
    // Total assets = collateral + yield
    let total_assets = collateral_value_usd
        .checked_add(yield_value_usd)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("💰 Total assets value: {} USD", total_assets as f64 / 1_000_000.0);
    
    // Calculate credit limit: total_assets * LTV / 10000
    vault.credit_limit = (total_assets as u128)
        .checked_mul(vault.ltv_ratio as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(BASIS_POINTS as u128)
        .ok_or(ZCrescaError::MathOverflow)? as u64;
    
    msg!("✅ New credit limit: {} USD", vault.credit_limit as f64 / 1_000_000.0);
    msg!("   LTV: {}%", vault.ltv_ratio as f64 / 100.0);
    msg!("   Available credit: {}", vault.available_credit());
    
    Ok(vault.credit_limit)
}
