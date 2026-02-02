use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct LiquidateVault<'info> {
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,
}

pub fn handler(_ctx: Context<LiquidateVault>) -> Result<()> {
    msg!("liquidate_vault - To be implemented");
    Ok(())
}
