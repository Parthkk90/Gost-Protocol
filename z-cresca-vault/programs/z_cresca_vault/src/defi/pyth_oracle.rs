use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{PriceUpdateV2, get_feed_id_from_hex};

/// Pyth Oracle integration for real-time price feeds
/// CRITICAL: Accurate pricing is essential for safe credit limit calculations

/// Pyth Program ID (mainnet and devnet)
declare_id!("rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ");

pub const PYTH_PROGRAM_ID: Pubkey = ID;

/// SOL/USD Price Feed ID (Pyth)
/// Devnet & Mainnet: Same feed ID
pub const SOL_USD_FEED_ID: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

/// USDC/USD Price Feed ID (Pyth)
pub const USDC_USD_FEED_ID: &str = "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

/// Maximum price age in seconds (5 minutes)
pub const MAX_PRICE_AGE: u64 = 300;

/// Get SOL price in USD from Pyth oracle
pub fn get_sol_price_usd(price_update_account: &AccountInfo) -> Result<(i64, i32, u64)> {
    let price_update = PriceUpdateV2::try_deserialize(&mut &price_update_account.data.borrow()[..])?;
    
    let feed_id = get_feed_id_from_hex(SOL_USD_FEED_ID)?;
    let price_feed = price_update.get_price_no_older_than(
        &Clock::get()?,
        MAX_PRICE_AGE,
        &feed_id,
    )?;
    
    msg!("📊 SOL/USD Price: {} (expo: {})", price_feed.price, price_feed.exponent);
    msg!("   Confidence: {}", price_feed.conf);
    msg!("   Publish time: {}", price_feed.publish_time);
    
    Ok((price_feed.price, price_feed.exponent, price_feed.conf))
}

/// Get USDC price in USD from Pyth oracle
pub fn get_usdc_price_usd(price_update_account: &AccountInfo) -> Result<(i64, i32, u64)> {
    let price_update = PriceUpdateV2::try_deserialize(&mut &price_update_account.data.borrow()[..])?;
    
    let feed_id = get_feed_id_from_hex(USDC_USD_FEED_ID)?;
    let price_feed = price_update.get_price_no_older_than(
        &Clock::get()?,
        MAX_PRICE_AGE,
        &feed_id,
    )?;
    
    msg!("📊 USDC/USD Price: {} (expo: {})", price_feed.price, price_feed.exponent);
    
    Ok((price_feed.price, price_feed.exponent, price_feed.conf))
}

/// Calculate collateral value in USD
/// 
/// Example: User has 10 SOL, SOL price is $150
/// Returns: 1500 * 10^6 (with 6 decimals for USDC equivalence)
pub fn calculate_collateral_value_usd(
    collateral_amount: u64,
    collateral_decimals: u8,
    price_update_account: &AccountInfo,
) -> Result<u64> {
    let (price, exponent, _confidence) = get_sol_price_usd(price_update_account)?;
    
    // Convert price to positive exponent (Pyth uses negative exponents)
    // price = 150 * 10^(-8) = 0.0000015 but we need $150
    let price_normalized = if exponent < 0 {
        let divisor = 10i64.pow((-exponent) as u32);
        price.checked_div(divisor).unwrap_or(0)
    } else {
        price.checked_mul(10i64.pow(exponent as u32)).unwrap_or(0)
    };
    
    // Calculate: (collateral_amount * price) / 10^decimals
    // Result in USD with 6 decimals (USDC standard)
    let value = (collateral_amount as i64)
        .checked_mul(price_normalized)
        .and_then(|v| v.checked_div(10i64.pow(collateral_decimals as u32)))
        .unwrap_or(0);
    
    msg!("💰 Collateral value: {} USD", value as f64 / 1_000_000.0);
    
    Ok(value as u64)
}

/// Validate price freshness and confidence
pub fn validate_price_quality(
    price: i64,
    confidence: u64,
    publish_time: i64,
) -> Result<()> {
    let clock = Clock::get()?;
    let age = clock.unix_timestamp.checked_sub(publish_time).unwrap_or(i64::MAX);
    
    require!(age <= MAX_PRICE_AGE as i64, crate::errors::ZCrescaError::OracleError);
    
    // Confidence interval should be < 1% of price
    let max_confidence = (price.abs() as u64).checked_div(100).unwrap_or(0);
    require!(
        confidence <= max_confidence,
        crate::errors::ZCrescaError::OracleError
    );
    
    msg!("✅ Price quality validated (age: {}s, confidence: {})", age, confidence);
    Ok(())
}
