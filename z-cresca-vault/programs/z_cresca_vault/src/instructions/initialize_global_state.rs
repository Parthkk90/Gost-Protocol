use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
    #[account(
        init,
        payer = authority,
        space = GlobalState::LEN,
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Treasury can be any account
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeGlobalState>,
    default_ltv: u16,
    base_interest_rate: u16,
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    let clock = Clock::get()?;
    
    // Validate parameters
    require!(
        default_ltv >= MIN_LTV && default_ltv <= MAX_LTV,
        ZCrescaError::InvalidLTV
    );
    require!(
        base_interest_rate <= MAX_INTEREST_RATE,
        ZCrescaError::InvalidInterestRate
    );
    
    // Initialize state
    global_state.authority = ctx.accounts.authority.key();
    global_state.treasury = ctx.accounts.treasury.key();
    global_state.default_ltv = default_ltv;
    global_state.base_interest_rate = base_interest_rate;
    global_state.paused = false;
    global_state.total_collateral = 0;
    global_state.total_credit_issued = 0;
    global_state.total_outstanding = 0;
    global_state.total_vaults = 0;
    global_state.total_yield_harvested = 0;
    global_state.total_interest_collected = 0;
    global_state.created_at = clock.unix_timestamp;
    global_state.last_update = clock.unix_timestamp;
    global_state.bump = ctx.bumps.global_state;
    
    msg!("✅ Z-Cresca protocol initialized");
    msg!("   Default LTV: {}%", default_ltv as f64 / 100.0);
    msg!("   Base Interest Rate: {}%", base_interest_rate as f64 / 100.0);
    
    Ok(())
}
