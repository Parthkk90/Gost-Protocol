use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED, owner.key().as_ref(), vault.vault_id.to_le_bytes().as_ref()],
        bump = vault.bump,
        has_one = owner,
        constraint = vault.active @ ZCrescaError::VaultInactive
    )]
    pub vault: Account<'info, CreditVault>,
    
    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump = global_state.bump,
        constraint = !global_state.paused @ ZCrescaError::ProtocolPaused
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == vault.collateral_token_mint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = vault_token_account.mint == vault.collateral_token_mint
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<DepositCollateral>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, ZCrescaError::InvalidAmount);
    require!(amount >= MIN_COLLATERAL, ZCrescaError::InsufficientCollateral);
    
    let vault = &mut ctx.accounts.vault;
    let global_state = &mut ctx.accounts.global_state;
    let clock = Clock::get()?;
    
    // Transfer tokens from user to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    // Update vault state
    vault.collateral_amount = vault
        .collateral_amount
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    // Recalculate credit limit
    let new_credit_limit = (vault.collateral_amount as u128)
        .checked_mul(vault.ltv_ratio as u128)
        .ok_or(ZCrescaError::MathOverflow)?
        .checked_div(BASIS_POINTS as u128)
        .ok_or(ZCrescaError::MathOverflow)? as u64;
    
    vault.credit_limit = new_credit_limit;
    
    // Update global state
    global_state.total_collateral = global_state
        .total_collateral
        .checked_add(amount)
        .ok_or(ZCrescaError::MathOverflow)?;
    global_state.total_credit_issued = global_state
        .total_credit_issued
        .checked_add(new_credit_limit.saturating_sub(vault.credit_limit))
        .ok_or(ZCrescaError::MathOverflow)?;
    global_state.last_update = clock.unix_timestamp;
    
    msg!("✅ Deposited {} tokens to vault", amount);
    msg!("   Total Collateral: {}", vault.collateral_amount);
    msg!("   New Credit Limit: {}", vault.credit_limit);
    msg!("   Available Credit: {}", vault.available_credit());
    
    Ok(())
}
