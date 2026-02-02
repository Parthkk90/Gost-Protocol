use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::defi::hyperion;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct DepositToCLMM<'info> {
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
    
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Deposit vault collateral into Hyperion CLMM pool to earn yield
/// 
/// This instruction:
/// 1. Takes USDC from vault
/// 2. Swaps portion to SOL (50/50 split typical for USDC-SOL)
/// 3. Creates concentrated liquidity position
/// 4. Stores position NFT in vault account
/// 
/// # Arguments
/// * `amount_usdc` - Amount of USDC to deposit
/// * `amount_sol` - Amount of SOL to pair (0 = auto-calculate)
/// * `price_lower` - Lower price tick for concentrated liquidity
/// * `price_upper` - Upper price tick for concentrated liquidity
pub fn handler(
    ctx: Context<DepositToCLMM>,
    amount_usdc: u64,
    amount_sol: u64,
    price_lower: u128,
    price_upper: u128,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    
    // Validation
    require!(vault.active, ZCrescaError::VaultInactive);
    require!(amount_usdc > 0, ZCrescaError::InvalidAmount);
    require!(price_lower < price_upper, ZCrescaError::InvalidPriceRange);
    
    msg!("📊 Depositing to Hyperion CLMM");
    msg!("   Vault: {}", vault.key());
    msg!("   USDC: {}, SOL: {}", amount_usdc, amount_sol);
    
    // Create position via Hyperion integration (currently stubbed)
    let position_nft = hyperion::create_position(
        vault,
        amount_usdc,
        amount_sol,
        price_lower,
        price_upper,
    )?;
    
    // Store position NFT in vault
    vault.lp_position_nft = position_nft;
    vault.last_yield_harvest = Clock::get()?.unix_timestamp;
    
    msg!("✅ CLMM position created");
    msg!("   Position NFT: {}", position_nft);
    
    Ok(())
}
