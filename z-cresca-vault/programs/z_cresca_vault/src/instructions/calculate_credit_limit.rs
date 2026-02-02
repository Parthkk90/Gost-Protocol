use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct CalculateCreditLimit<'info> {
    #[account(
        seeds = [VAULT_SEED, vault.owner.as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, CreditVault>,
}

pub fn handler(ctx: Context<CalculateCreditLimit>) -> Result<u64> {
    let vault = &ctx.accounts.vault;
    
    // Credit Limit = (Collateral + Yield) * LTV Ratio
    let total_assets = vault
        .collateral_amount
        .checked_add(vault.yield_earned)
        .unwrap();
    
    let new_limit = (total_assets as u128)
        .checked_mul(vault.ltv_ratio as u128)
        .unwrap()
        .checked_div(BASIS_POINTS as u128)
        .unwrap() as u64;
    
    msg!("💰 Credit limit updated: {}", new_limit);
    msg!("   Collateral: {}", vault.collateral_amount);
    msg!("   Yield: {}", vault.yield_earned);
    msg!("   Available: {}", vault.available_credit());
    
    Ok(new_limit)
}
