use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct RepayCredit<'info> {
    #[account(mut)]
    pub vault: Account<'info, CreditVault>,
    pub owner: Signer<'info>,
}

pub fn handler(_ctx: Context<RepayCredit>, _amount: u64) -> Result<()> {
    msg!("repay_credit - To be implemented");
    Ok(())
}
