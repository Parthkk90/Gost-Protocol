use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct PauseProtocol<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
    pub authority: Signer<'info>,
}

pub fn pause_handler(ctx: Context<PauseProtocol>) -> Result<()> {
    ctx.accounts.global_state.paused = true;
    msg!("⏸️  Protocol paused");
    Ok(())
}

#[derive(Accounts)]
pub struct UnpauseProtocol<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        has_one = authority
    )]
    pub global_state: Account<'info, GlobalState>,
    pub authority: Signer<'info>,
}

pub fn unpause_handler(ctx: Context<UnpauseProtocol>) -> Result<()> {
    ctx.accounts.global_state.paused = false;
    msg!("▶️  Protocol unpaused");
    Ok(())
}
