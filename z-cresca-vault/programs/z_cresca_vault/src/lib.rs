#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod defi;
pub mod credit;
pub mod zk;
pub mod errors;
pub mod constants;

use instructions::*;
use state::*;

declare_id!("HX5nu29URyVfVFDsiVRumvf64egFydNqgGibBpPxt3nz");

/// Z-Cresca Yield-Backed Credit Card Vault Program
/// 
/// This program enables users to:
/// 1. Deposit collateral (USDC/SOL) into yield-generating vaults
/// 2. Earn yield from Hyperion CLMM liquidity provision
/// 3. Access credit lines backed by their collateral + yield
/// 4. Make privacy-preserving card payments using ZK proofs
/// 5. Enjoy net positive returns (yield > interest)
#[program]
pub mod z_cresca_vault {
    use super::*;

    /// Initialize the global state (one-time, admin only)
    pub fn initialize_global_state(
        ctx: Context<InitializeGlobalState>,
        default_ltv: u16,
        base_interest_rate: u16,
    ) -> Result<()> {
        instructions::initialize_global_state::handler(ctx, default_ltv, base_interest_rate)
    }

    /// Create a new vault for a user
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_id: u64,
    ) -> Result<()> {
        instructions::initialize_vault::handler(ctx, vault_id)
    }

    /// Deposit collateral into the vault
    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        amount: u64,
    ) -> Result<()> {
        instructions::deposit_collateral::handler(ctx, amount)
    }

    /// Withdraw collateral from the vault (must repay debt first)
    pub fn withdraw_collateral(
        ctx: Context<WithdrawCollateral>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_collateral::handler(ctx, amount)
    }

    /// Calculate and update credit limit based on collateral + yield
    pub fn calculate_credit_limit(
        ctx: Context<CalculateCreditLimit>,
    ) -> Result<u64> {
        instructions::calculate_credit_limit::handler(ctx)
    }

    /// Update credit limit using real-time Pyth oracle prices (RECOMMENDED)
    pub fn update_credit_limit(
        ctx: Context<UpdateCreditLimit>,
    ) -> Result<u64> {
        instructions::update_credit_limit::handler(ctx)
    }

    /// Authorize a card payment (called by relayer)
    pub fn authorize_payment(
        ctx: Context<AuthorizePayment>,
        amount: u64,
        merchant: Pubkey,
    ) -> Result<bool> {
        instructions::authorize_payment::handler(ctx, amount, merchant)
    }

    /// Execute a payment by swapping collateral and paying merchant
    /// This is the CRITICAL instruction that makes the credit card work
    pub fn execute_payment<'info>(
        ctx: Context<'_, '_, '_, 'info, ExecutePayment<'info>>,
        payment_amount_usdc: u64,
        swap_amount_in: u64,
        minimum_swap_out: u64,
        slippage_bps: u16,
    ) -> Result<()> {
        instructions::execute_payment::handler(
            ctx,
            payment_amount_usdc,
            swap_amount_in,
            minimum_swap_out,
            slippage_bps,
        )
    }

    /// Create a one-time burner wallet for privacy (Week 13-14)
    pub fn create_burner_wallet(
        ctx: Context<CreateBurnerWallet>,
        nonce: u64,
        merchant: Pubkey,
        amount: u64,
        ttl_seconds: i64,
    ) -> Result<Pubkey> {
        instructions::create_burner_wallet::handler(ctx, nonce, merchant, amount, ttl_seconds)
    }

    /// Pay with burner wallet (privacy-preserving)
    pub fn pay_with_burner(
        ctx: Context<PayWithBurner>,
        amount: u64,
    ) -> Result<()> {
        instructions::pay_with_burner::handler(ctx, amount)
    }

    /// Repay outstanding credit balance
    pub fn repay_credit(
        ctx: Context<RepayCredit>,
        amount: u64,
    ) -> Result<()> {
        instructions::repay_credit::handler(ctx, amount)
    }

    /// Harvest yield from DeFi positions (Hyperion CLMM)
    pub fn harvest_yield(
        ctx: Context<HarvestYield>,
    ) -> Result<(u64, u64)> {
        instructions::harvest_yield::handler(ctx)
    }

    /// Deposit collateral to Hyperion CLMM
    pub fn deposit_to_clmm(
        ctx: Context<DepositToCLMM>,
        amount0: u64,
        amount1: u64,
        price_lower: u128,
        price_upper: u128,
    ) -> Result<()> {
        instructions::deposit_to_clmm::handler(ctx, amount0, amount1, price_lower, price_upper)
    }

    /// Withdraw from Hyperion CLMM
    pub fn withdraw_from_clmm(
        ctx: Context<WithdrawFromCLMM>,
        liquidity: u128,
    ) -> Result<(u64, u64)> {
        instructions::withdraw_from_clmm::handler(ctx, liquidity)
    }

    /// Accrue interest on outstanding balance
    pub fn accrue_interest(
        ctx: Context<AccrueInterest>,
    ) -> Result<()> {
        instructions::accrue_interest::handler(ctx)
    }

    /// Check vault health and liquidate if necessary
    pub fn liquidate_vault(
        ctx: Context<LiquidateVault>,
    ) -> Result<()> {
        instructions::liquidate_vault::handler(ctx)
    }

    /// Verify ZK proof for private credit authorization
    pub fn verify_credit_proof(
        ctx: Context<VerifyCreditProof>,
        proof: Vec<u8>,
        public_inputs: Vec<u64>,
    ) -> Result<bool> {
        instructions::verify_credit_proof::handler(ctx, proof, public_inputs)
    }

    /// Emergency pause (admin only)
    pub fn pause_protocol(
        ctx: Context<PauseProtocol>,
    ) -> Result<()> {
        instructions::pause_protocol::pause_handler(ctx)
    }

    /// Unpause protocol (admin only)
    pub fn unpause_protocol(
        ctx: Context<UnpauseProtocol>,
    ) -> Result<()> {
        instructions::pause_protocol::unpause_handler(ctx)
    }
}
