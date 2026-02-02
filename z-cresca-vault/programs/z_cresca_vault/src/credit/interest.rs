// Interest rate calculations
use anchor_lang::prelude::*;

pub fn calculate_dynamic_rate(utilization_bps: u64, base_rate: u16) -> u16 {
    // Simple linear model: Rate = Base + (Utilization * 5%)
    let variable = (utilization_bps * 500) / 10000;
    (base_rate as u64 + variable).min(2000) as u16
}
