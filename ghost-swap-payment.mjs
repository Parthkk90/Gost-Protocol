import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync } from 'fs';
import SilentGhostService from './silent-ghost-service.mjs';

// Load customer keypair
const customerKeypair = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync('customer-keypair.json')))
);

// Solana connection
const connection = new Connection('https://api.mainnet-beta.solana.com');

// Merchant details (example)
const merchantAddress = 'GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW'; // Your wallet
const amount = 8000000; // 0.008 SOL in lamports

async function main() {
  console.log('🚀 Starting Ghost Swap Cross-Chain Payment...');

  // Initialize the service
  const ghostService = new SilentGhostService(customerKeypair);

  try {
    // Create the order (shield and potentially swap to another chain)
    const order = await ghostService.createSilentOrder(merchantAddress, amount, 'ethereum'); // Example: to Ethereum

    // Execute the payment (deposit to SilentSwap vault)
    const tx = await ghostService.executePayment(order);

    console.log('✅ Payment completed successfully!');
    console.log(`Transaction Signature: ${tx.signature}`);
    console.log('🔒 Funds are now shielded and en route to merchant on target chain.');

  } catch (error) {
    console.error('❌ Error during payment:', error);
  }
}

main();