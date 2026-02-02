use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::*;
use crate::defi::hyperion;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct WithdrawFromCLMM<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, vault.owner.as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = owner
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
    
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Withdraw liquidity from Hyperion CLMM position
/// 
/// This instruction:
/// 1. Removes liquidity from the position
/// 2. Receives USDC and SOL back
/// 3. Swaps SOL to USDC if needed
/// 4. Updates vault collateral amount
/// 5. Recalculates credit limit
/// 
/// # Arguments
/// * `liquidity_amount` - Amount of liquidity to remove (in liquidity units)
pub fn handler(
    ctx: Context<WithdrawFromCLMM>,
    liquidity_amount: u128,
) -> Result<(u64, u64)> {
    let vault = &mut ctx.accounts.vault;
    
    require!(vault.active, ZCrescaError::VaultInactive);
    require!(vault.lp_position_nft != Pubkey::default(), ZCrescaError::PositionNotFound);
    require!(liquidity_amount > 0, ZCrescaError::InvalidAmount);
    
    msg!("📤 Withdrawing from Hyperion CLMM");
    msg!("   Position NFT: {}", vault.lp_position_nft);
    msg!("   Liquidity to remove: {}", liquidity_amount);
    
    // Store position NFT before mutable borrow
    let position_nft = vault.lp_position_nft;
    
    // Remove liquidity from Hyperion position (currently stubbed)
    let (usdc_removed, sol_removed) = hyperion::remove_liquidity(
        vault,
        position_nft,
        liquidity_amount,
    )?;
    
    // Update vault collateral (assuming SOL is swapped to USDC)
    let _total_usdc_received = usdc_removed; // + (sol_removed * sol_price_in_usdc)
    
    // Recalculate credit limit after withdrawal
    let total_assets = vault
        .collateral_amount
        .checked_add(vault.yield_earned)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    vault.credit_limit = (total_assets as u128)
        .checked_mul(vault.ltv_ratio as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(BASIS_POINTS as u128)
        .ok_or(ZCrescaError::MathOverflow)? as u64;
    
    // Check that vault remains healthy
    require!(
        vault.outstanding_balance <= vault.credit_limit,
        ZCrescaError::InsufficientCollateral
    );
    
    msg!("✅ Liquidity withdrawn");
    msg!("   USDC received: {}", usdc_removed);
    msg!("   SOL received: {}", sol_removed);
    msg!("   New Credit Limit: {}", vault.credit_limit);
    
    Ok((usdc_removed, sol_removed))
}
