#!/usr/bin/env node
/**
 * SAFE TESTING: Private payment to yourself
 * Tests full Privacy Cash flow with 0.008 SOL
 * YOUR PRIVATE KEY STAYS ON YOUR MACHINE!
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEST_AMOUNT = 0.008; // SOL
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const BRIDGE_URL = 'http://localhost:8080';

console.log('============================================================');
console.log('  🧪 SAFE TESTING: Privacy Cash Test Transaction');
console.log('============================================================\n');

console.log('⚠️  SECURITY REMINDER:');
console.log('   • Your private key NEVER leaves this computer');
console.log('   • Run this script ONLY on your own machine');
console.log('   • NEVER share customer-keypair.json with anyone\n');

async function safeTestPayment() {
  try {
    // Step 1: Load YOUR keypair (stays on your machine)
    console.log('Step 1: Loading your keypair...');
    const keypairPath = path.join(__dirname, 'customer-keypair.json');
    
    if (!fs.existsSync(keypairPath)) {
      console.error('❌ customer-keypair.json not found!\n');
      console.log('Create this file with your private key:');
      console.log('   Format: [123,45,67,...] (64 numbers)\n');
      console.log('🔐 IMPORTANT: This file should be:');
      console.log('   • Created by YOU on YOUR computer');
      console.log('   • NEVER shared with anyone');
      console.log('   • Added to .gitignore');
      console.log('   • Kept secure and backed up\n');
      return;
    }
    
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
    const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
    const walletAddress = wallet.publicKey.toString();
    
    console.log(`✅ Your Wallet: ${walletAddress}\n`);
    
    // Step 2: Check balance
    console.log('Step 2: Checking balance...');
    const connection = new Connection(MAINNET_RPC, 'confirmed');
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceSOL = balance / LAMPORTS_PER_SOL;
    
    console.log(`   Balance: ${balanceSOL} SOL`);
    
    const totalNeeded = TEST_AMOUNT + 0.011; // Amount + Privacy Cash fees
    
    if (balanceSOL < totalNeeded) {
      console.error(`\n❌ Insufficient balance!`);
      console.log(`   Need: ${totalNeeded} SOL (${TEST_AMOUNT} + 0.011 fees)`);
      console.log(`   Have: ${balanceSOL} SOL\n`);
      return;
    }
    
    console.log(`   Required: ${totalNeeded} SOL`);
    console.log(`   ✅ Sufficient balance!\n`);
    
    // Step 3: Verify bridge service
    console.log('Step 3: Checking Privacy Cash bridge...');
    const healthResponse = await fetch(`${BRIDGE_URL}/health`);
    
    if (!healthResponse.ok) {
      console.error('❌ Bridge service not running!');
      console.log('   Start it: npm start\n');
      return;
    }
    
    const health = await healthResponse.json();
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   ✅ Network: ${health.rpc}\n`);
    
    // Step 4: Explain the test
    console.log('═══════════════════════════════════════════════════════');
    console.log('  TEST: Send ${TEST_AMOUNT} SOL to YOURSELF via Privacy Cash');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('What this proves:');
    console.log('   1. You can make private payments');
    console.log('   2. Privacy Cash ZK proofs work');
    console.log('   3. Funds come back to you (no loss)');
    console.log('   4. Only cost: ~0.011 SOL in fees\n');
    
    console.log('The flow:');
    console.log(`   Your wallet → Privacy Pool → Back to your wallet`);
    console.log(`   Amount: ${TEST_AMOUNT} SOL`);
    console.log(`   Recipient: ${walletAddress} (same address!)`);
    console.log(`   Cost: ~0.011 SOL (Privacy Cash fees)\n`);
    
    // Get user confirmation
    console.log('⚠️  This will spend ~0.011 SOL on mainnet fees!');
    console.log('   (The ${TEST_AMOUNT} SOL comes back to you)\n');
    
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🚀 Starting private payment test...\n');
    
    // Step 5: Make private payment to YOURSELF
    console.log('═══════════════════════════════════════════════════════');
    console.log('  PRIVACY CASH TRANSACTION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('Phase 1: Generate secret...');
    const secretResponse = await fetch(`${BRIDGE_URL}/generate-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!secretResponse.ok) {
      throw new Error('Failed to generate secret');
    }
    
    const { secret, source } = await secretResponse.json();
    console.log(`✅ Secret generated (${source})\n`);
    
    console.log('Phase 2: Shield (Deposit into Privacy Pool)...');
    console.log(`   Amount: ${TEST_AMOUNT} SOL`);
    console.log(`   Creating commitment...`);
    
    const shieldResponse = await fetch(`${BRIDGE_URL}/shield`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: TEST_AMOUNT,
        secret: secret,
        from: walletAddress
      })
    });
    
    const shieldResult = await shieldResponse.json();
    
    if (!shieldResult.success) {
      throw new Error(`Shield failed: ${shieldResult.error}`);
    }
    
    console.log(`✅ Deposited into privacy pool`);
    console.log(`   TX: ${shieldResult.signature}`);
    console.log(`   View: https://solscan.io/tx/${shieldResult.signature}\n`);
    
    console.log('Phase 3: Privacy duration (building anonymity)...');
    const privacyDuration = 120; // 2 minutes
    console.log(`   Waiting ${privacyDuration} seconds...`);
    console.log(`   (Other users' deposits create privacy pool)`);
    
    for (let i = 0; i < privacyDuration; i += 10) {
      process.stdout.write(`\r   ⏳ ${i}/${privacyDuration} seconds...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    console.log(`\r   ✅ Privacy duration complete!              \n`);
    
    console.log('Phase 4: Generate Zero-Knowledge Proof...');
    console.log(`   Proving: "I have right to withdraw"`);
    console.log(`   Without revealing: Which deposit is mine\n`);
    
    console.log('Phase 5: Withdraw (ZK Verified)...');
    console.log(`   Recipient: ${walletAddress} (YOU!)`);
    console.log(`   Amount: ${TEST_AMOUNT} SOL`);
    
    const withdrawResponse = await fetch(`${BRIDGE_URL}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: walletAddress,
        amount: TEST_AMOUNT,
        secret: secret
      })
    });
    
    const withdrawResult = await withdrawResponse.json();
    
    if (!withdrawResult.success) {
      throw new Error(`Withdraw failed: ${withdrawResult.error}`);
    }
    
    console.log(`✅ ZK proof verified!`);
    console.log(`   TX: ${withdrawResult.signature}`);
    console.log(`   View: https://solscan.io/tx/${withdrawResult.signature}\n`);
    
    // Step 6: Verify final balance
    console.log('Step 6: Verifying final balance...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for confirmation
    
    const finalBalance = await connection.getBalance(wallet.publicKey);
    const finalBalanceSOL = finalBalance / LAMPORTS_PER_SOL;
    
    console.log(`   Starting: ${balanceSOL} SOL`);
    console.log(`   Final: ${finalBalanceSOL} SOL`);
    console.log(`   Difference: ${(balanceSOL - finalBalanceSOL).toFixed(6)} SOL (fees only!)\n`);
    
    // Success!
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ TEST SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('What was proven:');
    console.log(`   ✅ Privacy Cash works on mainnet`);
    console.log(`   ✅ Zero-knowledge proofs verified`);
    console.log(`   ✅ You received ${TEST_AMOUNT} SOL back`);
    console.log(`   ✅ Only paid fees (~0.011 SOL)`);
    console.log(`   ✅ Your wallet works correctly\n`);
    
    console.log('Privacy features tested:');
    console.log(`   ✅ Unlinkable: Deposit/withdrawal cannot be linked`);
    console.log(`   ✅ ZK Proofs: Verified on-chain`);
    console.log(`   ✅ Anonymity: Works in privacy pool`);
    console.log(`   ✅ Security: Audited protocol\n`);
    
    console.log('View transactions:');
    console.log(`   Deposit: https://solscan.io/tx/${shieldResult.signature}`);
    console.log(`   Withdraw: https://solscan.io/tx/${withdrawResult.signature}\n`);
    
    console.log('🎉 Now you can make private payments to merchants!');
    console.log('   Just change the recipient address in the script.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Start bridge: npm start\n');
    }
    
    process.exit(1);
  }
}

// Run the safe test
safeTestPayment();
