use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct AccrueInterest<'info> {
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,
}

pub fn handler(_ctx: Context<AccrueInterest>) -> Result<()> {
    msg!("accrue_interest - Implemented in authorize_payment");
    Ok(())
}
