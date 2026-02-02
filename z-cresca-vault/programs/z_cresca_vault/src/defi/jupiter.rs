// Jupiter aggregator integration for optimal token swaps
// Used to convert collateral (e.g., SOL) into payment currency (e.g., USDC)

use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::errors::*;

/// Jupiter Aggregator Program ID (v6)
declare_id!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");

pub const JUPITER_PROGRAM_ID: Pubkey = ID;

/// Execute a swap through Jupiter Aggregator
/// 
/// This is the CRITICAL function for the credit card to work:
/// When a payment is authorized, we swap collateral (SOL) to payment token (USDC)
/// 
/// Required accounts (passed via remaining_accounts):
/// - Jupiter program accounts (varies by route, typically 8-15 accounts)
/// - Source token account (vault's collateral)
/// - Destination token account (receives USDC for payment)
/// - Intermediate accounts for multi-hop swaps
/// 
/// Flow:
/// 1. User swipes card at merchant (needs $100 USDC)
/// 2. authorize_payment checks credit limit ✅
/// 3. Call jupiter_swap to convert SOL → USDC
/// 4. Transfer USDC to merchant via relayer
pub fn execute_swap_cpi<'info>(
    jupiter_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    user_source_token_account: &AccountInfo<'info>,
    user_destination_token_account: &AccountInfo<'info>,
    user_transfer_authority: &AccountInfo<'info>,
    amount_in: u64,
    minimum_amount_out: u64,
    platform_fee_bps: u16,
    remaining_accounts: &[AccountInfo<'info>],
) -> Result<u64> {
    msg!("🔄 Executing Jupiter swap");
    msg!("   Amount in: {}", amount_in);
    msg!("   Min amount out: {}", minimum_amount_out);
    msg!("   Slippage: {}%", (10000 - (minimum_amount_out * 10000 / amount_in)) / 100);
    
    require!(amount_in > 0, ZCrescaError::InvalidAmount);
    require!(minimum_amount_out > 0, ZCrescaError::InvalidAmount);
    require!(platform_fee_bps <= 1000, ZCrescaError::InvalidAmount); // Max 10% fee
    
    // TODO: Build and execute actual Jupiter CPI
    // Real implementation:
    // 1. Parse Jupiter route accounts from remaining_accounts
    // 2. Build SharedAccountsRoute or ExactInRoute instruction
    // 3. Include vault PDA seeds for signing the swap
    // 4. Execute CPI with proper account metas
    // 5. Return actual amount received
    
    // Stub: Return minimum amount (assumes perfect swap)
    msg!("   ⚠️  Using stub - real Jupiter CPI not implemented yet");
    Ok(minimum_amount_out)
}

/// Get Jupiter quote (off-chain helper for testing)
/// In production, this is called off-chain by the relayer/client
/// to get the best route before calling execute_swap_cpi
pub fn get_quote_info(
    input_mint: Pubkey,
    output_mint: Pubkey,
    amount: u64,
    slippage_bps: u16,
) -> Result<()> {
    msg!("📊 Jupiter quote request");
    msg!("   Input: {} ({})", input_mint, amount);
    msg!("   Output: {}", output_mint);
    msg!("   Slippage: {} bps", slippage_bps);
    
    // This function is for documentation only
    // Real quotes must be fetched off-chain via Jupiter API
    // https://quote-api.jup.ag/v6/quote
    
    Ok(())
}

/// Validate Jupiter swap parameters
pub fn validate_swap_params(
    amount_in: u64,
    minimum_amount_out: u64,
    max_slippage_bps: u16,
) -> Result<()> {
    require!(amount_in > 0, ZCrescaError::InvalidAmount);
    require!(minimum_amount_out > 0, ZCrescaError::InvalidAmount);
    
    // Calculate actual slippage
    let expected_rate = (minimum_amount_out as u128 * 10000) / amount_in as u128;
    let max_rate = 10000u128;
    let slippage = max_rate.saturating_sub(expected_rate);
    
    require!(
        slippage <= max_slippage_bps as u128,
        ZCrescaError::SlippageExceeded
    );
    
    msg!("✅ Swap params valid (slippage: {} bps)", slippage);
    Ok(())
}

