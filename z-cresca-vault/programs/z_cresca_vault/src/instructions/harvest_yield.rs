use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::*;
use crate::defi::hyperion;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct HarvestYield<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, CreditVault>,
    
    #[account(
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        constraint = !global_state.paused @ ZCrescaError::ProtocolPaused
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub vault_usdc_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub vault_sol_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

/// Harvest trading fees from Hyperion CLMM position
pub fn handler(ctx: Context<HarvestYield>) -> Result<(u64, u64)> {
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;
    
    require!(vault.active, ZCrescaError::VaultInactive);
    require!(vault.lp_position_nft != Pubkey::default(), ZCrescaError::PositionNotFound);
    
    msg!("💰 Harvesting yield from Hyperion position");
    msg!("   Position NFT: {}", vault.lp_position_nft);
    
    // Collect fees from Hyperion position (currently stubbed)
    let (fees_usdc, fees_sol) = hyperion::collect_fees(
        vault,
        vault.lp_position_nft,
    )?;
    
    // Update vault yield
    let total_yield_usdc = fees_usdc;
    vault.yield_earned = vault
        .yield_earned
        .checked_add(total_yield_usdc)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.last_yield_harvest = clock.unix_timestamp;
    
    // Recalculate credit limit
    let total_assets = vault
        .collateral_amount
        .checked_add(vault.yield_earned)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.credit_limit = (total_assets as u128)
        .checked_mul(vault.ltv_ratio as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(BASIS_POINTS as u128)
        .ok_or(ZCrescaError::MathOverflow)? as u64;
    
    msg!("✅ Harvested: {} USDC, {} SOL", fees_usdc, fees_sol);
    msg!("   New Credit Limit: {}", vault.credit_limit);
    
    Ok((fees_usdc, fees_sol))
}
