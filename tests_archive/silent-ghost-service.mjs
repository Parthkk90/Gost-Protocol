import { createSilentSwapClient, SOLANA_CHAIN_ID, BITCOIN_CHAIN_ID, COMMON_ASSETS, ENVIRONMENT, executeDebridgeBridge } from '@silentswap/sdk';
import { Connection, Keypair } from '@solana/web3.js';

// Define Chain and Asset enums based on SDK constants
const Chain = {
  Solana: SOLANA_CHAIN_ID,
  Bitcoin: BITCOIN_CHAIN_ID,
  Ethereum: 1, // Standard Ethereum chain ID
  // Add more as needed
};

const Asset = {
  SOL: COMMON_ASSETS.SOL || 'SOL',
  USDC: COMMON_ASSETS.USDC || 'USDC',
  // Add more
};

class SilentGhostService {
    constructor(wallet) {
        // Initialize the SDK client
        this.silent = createSilentSwapClient({
            environment: ENVIRONMENT.MAINNET,
            apiKey: process.env.SILENT_SWAP_API_KEY
        });
        this.wallet = wallet;
    }

    /**
     * Create a Cross-Chain Private Payment
     */
    async createSilentOrder(merchantAddress, amount, targetChain) {
        console.log('🤫 Fetching Quotes for SilentSwap V2...');

        // Map string chains to IDs
        const chainMapping = {
            'solana': SOLANA_CHAIN_ID,
            'ethereum': 1,
            'bitcoin': BITCOIN_CHAIN_ID,
            // Add more
        };
        const destChainId = chainMapping[targetChain.toLowerCase()] || targetChain;

        // REAL SDK CALL
        const quotes = await this.silent.getSwapQuotes({
            sourceChainId: SOLANA_CHAIN_ID,
            sourceAssetAddress: COMMON_ASSETS.SOL,
            destinationChainId: destChainId,
            destinationAssetAddress: COMMON_ASSETS.USDC,
            amount: amount.toString(), // Must be in base units (lamports)
        });

        if (!quotes || quotes.length === 0) {
            throw new Error("No bridge routes found for this payment.");
        }

        // 2. Select the best quote (usually the first one)
        const bestQuote = quotes[0];
        console.log(`✅ Bridge Selected: ${bestQuote.provider}`);

// REAL SDK CALL
        const order = await this.silent.createOrder({
            quote: bestQuote,
            destinationAddress: merchantAddress,
            refundAddress: this.wallet.publicKey.toString(),
        });

        return order;
    }

    /**
     * Execute the Deposit (The "Shielding" Step)
     */
    async executePayment(order) {
        console.log('🚀 Sending funds to the SilentSwap Vault...');

        try {
// Ensure you are using the correct transaction utility for V2
        const tx = await this.silent.executeOrder(order, {
            wallet: this.wallet,
            // Add priority fees if mainnet is congested
            computeUnitLimit: 300000,
        });

            console.log(`🔥 Funds Shielded! Signature: ${mockTx.signature}`);
            return mockTx;
        } catch (err) {
            console.error("Internal Bridge Error:", err.message);
            throw err;
        }
    }
}

export default SilentGhostService;