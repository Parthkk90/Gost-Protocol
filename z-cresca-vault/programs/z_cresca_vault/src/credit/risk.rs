// Risk management and health factor calculations
use anchor_lang::prelude::*;

pub fn calculate_health_factor(collateral: u64, debt: u64, ltv_bps: u16) -> u64 {
    if debt == 0 {
        return u64::MAX;
    }
    let max_borrow = (collateral as u128 * ltv_bps as u128) / 10000;
    ((max_borrow * 10000) / debt as u128) as u64
}
