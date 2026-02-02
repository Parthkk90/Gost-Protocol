/// Program constants

/// Basis points denominator (10000 = 100%)
pub const BASIS_POINTS: u64 = 10_000;

/// Default LTV ratio (15000 = 150% = 1.5x leverage)
pub const DEFAULT_LTV: u16 = 15_000;

/// Minimum LTV (10000 = 100% = 1.0x, no leverage)
pub const MIN_LTV: u16 = 10_000;

/// Maximum LTV (20000 = 200% = 2.0x leverage)
pub const MAX_LTV: u16 = 20_000;

/// Liquidation threshold (12000 = 120% health factor)
pub const LIQUIDATION_THRESHOLD: u64 = 12_000;

/// Default base interest rate (200 = 2% APR)
pub const DEFAULT_BASE_INTEREST: u16 = 200;

/// Maximum interest rate (2000 = 20% APR cap)
pub const MAX_INTEREST_RATE: u16 = 2_000;

/// Interest rate multiplier (100 = 1% per utilization)
pub const INTEREST_MULTIPLIER: u64 = 100;

/// Seconds per year (for APR calculations)
pub const SECONDS_PER_YEAR: i64 = 365 * 24 * 60 * 60;

/// Minimum collateral amount (1 USDC)
pub const MIN_COLLATERAL: u64 = 1_000_000;

/// Default daily spending limit (1000 USDC)
pub const DEFAULT_DAILY_LIMIT: u64 = 1_000_000_000;

/// Vault PDA seed prefix
pub const VAULT_SEED: &[u8] = b"vault";

/// Global state PDA seed
pub const GLOBAL_STATE_SEED: &[u8] = b"global_state";

/// LP position PDA seed
pub const LP_POSITION_SEED: &[u8] = b"lp_position";

/// Maximum number of vaults per user
pub const MAX_VAULTS_PER_USER: u8 = 10;

/// Yield harvesting fee (50 basis points = 0.5%)
pub const HARVEST_FEE_BPS: u16 = 50;

/// Protocol fee destination (treasury)
pub const TREASURY_FEE_BPS: u16 = 10; // 0.1% of transactions
