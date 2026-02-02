use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::defi::jupiter;
use crate::errors::*;
use crate::constants::*;

/// Execute a payment by swapping collateral to payment token via Jupiter
/// 
/// This is the CRITICAL instruction that makes the credit card work:
/// User has SOL collateral → Merchant wants USDC → We swap and pay
#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(
        mut,
        has_one = owner @ ZCrescaError::Unauthorized,
        constraint = vault.outstanding_balance > 0 @ ZCrescaError::NoOutstandingBalance,
    )]
    pub vault: Account<'info, CreditVault>,
    
    pub owner: Signer<'info>,
    
    /// Vault's collateral token account (source for swap)
    #[account(mut)]
    pub vault_collateral_account: Account<'info, TokenAccount>,
    
    /// Vault's payment token account (destination from swap)
    #[account(mut)]
    pub vault_payment_account: Account<'info, TokenAccount>,
    
    /// Merchant's payment token account (final recipient)
    #[account(mut)]
    pub merchant_account: Account<'info, TokenAccount>,
    
    /// Jupiter program
    /// CHECK: Verified in CPI call
    pub jupiter_program: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    
    // Remaining accounts: Jupiter swap route accounts (varies by route)
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, ExecutePayment<'info>>,
    payment_amount_usdc: u64,
    swap_amount_in: u64,
    minimum_swap_out: u64,
    slippage_bps: u16,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    
    msg!("💳 Executing payment");
    msg!("   Merchant payment: {} USDC", payment_amount_usdc);
    msg!("   Swapping: {} SOL → {} USDC (min)", swap_amount_in, minimum_swap_out);
    
    // Validate payment amount matches authorized balance
    require!(
        payment_amount_usdc <= vault.outstanding_balance,
        ZCrescaError::InsufficientCredit
    );
    
    // Validate swap will cover payment
    require!(
        minimum_swap_out >= payment_amount_usdc,
        ZCrescaError::InsufficientSwapOutput
    );
    
    // Validate slippage
    jupiter::validate_swap_params(swap_amount_in, minimum_swap_out, slippage_bps)?;
    
    // Execute swap: SOL → USDC via Jupiter
    let amount_received = jupiter::execute_swap_cpi(
        &ctx.accounts.jupiter_program,
        &ctx.accounts.token_program.to_account_info(),
        &ctx.accounts.vault_collateral_account.to_account_info(),
        &ctx.accounts.vault_payment_account.to_account_info(),
        &ctx.accounts.owner.to_account_info(),
        swap_amount_in,
        minimum_swap_out,
        0, // No platform fee for now
        ctx.remaining_accounts,
    )?;
    
    msg!("   Swap received: {} USDC", amount_received);
    
    // Transfer swapped USDC to merchant
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_payment_account.to_account_info(),
        to: ctx.accounts.merchant_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    token::transfer(cpi_ctx, payment_amount_usdc)?;
    
    // Update vault balance
    vault.outstanding_balance = vault.outstanding_balance
        .checked_sub(payment_amount_usdc)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    // Track payment
    vault.total_payments = vault.total_payments
        .checked_add(1)
        .ok_or(ZCrescaError::MathOverflow)?;
    
    msg!("✅ Payment executed successfully");
    msg!("   New outstanding balance: {}", vault.outstanding_balance);
    
    Ok(())
}
