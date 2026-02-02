use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(vault_id: u64)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = CreditVault::LEN,
        seeds = [VAULT_SEED, owner.key().as_ref(), vault_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Account<'info, CreditVault>,
    
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub collateral_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<InitializeVault>,
    vault_id: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let global_state = &mut ctx.accounts.global_state;
    let clock = Clock::get()?;
    
    require!(!global_state.paused, ZCrescaError::ProtocolPaused);
    
    // Initialize vault
    vault.owner = ctx.accounts.owner.key();
    vault.vault_id = vault_id;
    vault.collateral_token_mint = ctx.accounts.collateral_mint.key();
    vault.collateral_amount = 0;
    vault.credit_limit = 0;
    vault.outstanding_balance = 0;
    vault.yield_earned = 0;
    vault.interest_paid = 0;
    vault.lp_position_nft = Pubkey::default();
    vault.lp_liquidity = 0;
    vault.last_interest_update = clock.unix_timestamp;
    vault.last_yield_harvest = clock.unix_timestamp;
    vault.created_at = clock.unix_timestamp;
    vault.ltv_ratio = global_state.default_ltv;
    vault.current_interest_rate = global_state.base_interest_rate;
    vault.daily_limit = DEFAULT_DAILY_LIMIT;
    vault.daily_spent = 0;
    vault.last_daily_reset = clock.unix_timestamp;
    vault.active = true;
    vault.total_payments = 0;
    vault.total_payment_volume = 0;
    vault.current_burner = Pubkey::default();
    vault.burner_rotation_count = 0;
    vault.bump = ctx.bumps.vault;
    
    // Update global state
    global_state.total_vaults = global_state
        .total_vaults
        .checked_add(1)
        .ok_or(ZCrescaError::MathOverflow)?;
    global_state.last_update = clock.unix_timestamp;
    
    msg!("✅ Vault created for user: {}", ctx.accounts.owner.key());
    msg!("   Vault ID: {}", vault_id);
    msg!("   LTV Ratio: {}%", vault.ltv_ratio as f64 / 100.0);
    
    Ok(())
}
