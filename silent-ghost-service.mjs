import { createSilentSwapClient, SOLANA_CHAIN_ID, BITCOIN_CHAIN_ID, COMMON_ASSETS, ENVIRONMENT, executeDebridgeBridge } from '@silentswap/sdk';
import { Connection, Keypair } from '@solana/web3.js';

// Define Chain and Asset enums based on SDK constants
const Chain = {
  Solana: SOLANA_CHAIN_ID,
  Bitcoin: BITCOIN_CHAIN_ID,
  // Add more as needed, e.g., Ethereum: '1' or whatever the SDK uses
};

const Asset = {
  SOL: COMMON_ASSETS.SOL || 'SOL',
  USDC: COMMON_ASSETS.USDC || 'USDC',
  // Add more
};

class SilentGhostService {
    constructor(wallet) {
        // Initialize the SDK client
        this.client = createSilentSwapClient({
            environment: ENVIRONMENT.MAINNET,
            apiKey: process.env.SILENT_SWAP_API_KEY
        });
        this.wallet = wallet;
    }

    /**
     * Create a Cross-Chain Private Payment
     * From: Solana (SOL) -> To: Any Chain (USDC/SOL/ETH)
     */
    async createSilentOrder(merchantAddress, amount, targetChain = Chain.Solana) {
        console.log('🤫 Initializing SilentSwap V2 Order...');

        const orderParams = {
            sourceChain: Chain.Solana,
            sourceAsset: Asset.SOL,
            destinationChain: targetChain,
            destinationAsset: Asset.USDC,
            destinationAddress: merchantAddress,
            amount: amount,
        };

        console.log(`✅ Order Params Prepared`);
        return orderParams;
    }

    /**
     * Execute the Deposit (The "Shielding" Step)
     */
    async executePayment(orderParams) {
        console.log('🚀 Sending funds to the SilentSwap Vault...');

        // Execute the bridge transaction
        const tx = await executeDebridgeBridge(orderParams, this.wallet);

        console.log(`🔥 Funds Shielded! Signature: ${tx.signature}`);
        return tx;
    }
}

export default SilentGhostService;