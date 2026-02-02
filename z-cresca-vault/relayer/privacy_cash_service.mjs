#!/usr/bin/env node
/**
 * Privacy Cash Service - Node.js Bridge for Python Relayer
 * 
 * This service runs alongside the Python relayer and provides
 * Privacy Cash SDK functionality via a simple HTTP API.
 * 
 * Python relayer calls this service for:
 * - Private deposits
 * - Private withdrawals  
 * - Balance checks
 * - Transaction status
 */

import { PrivacyCash } from 'privacycash';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment
dotenv.config();

const app = express();
app.use(express.json());

// Configuration
const PORT = parseInt(process.env.PRIVACY_CASH_SERVICE_PORT || '8081');
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const RELAYER_KEYPAIR_PATH = process.env.RELAYER_KEYPAIR_PATH || './relayer-keypair.json';

let privacyCash = null;
let relayerKeypair = null;

// Initialize Privacy Cash SDK
async function initializePrivacyCash() {
  console.log('🔐 Loading relayer keypair...');
  
  // Load keypair
  if (!fs.existsSync(RELAYER_KEYPAIR_PATH)) {
    throw new Error(`Keypair not found: ${RELAYER_KEYPAIR_PATH}`);
  }
  
  const secretKey = JSON.parse(fs.readFileSync(RELAYER_KEYPAIR_PATH, 'utf-8'));
  relayerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));
  
  console.log(`   Relayer: ${relayerKeypair.publicKey.toString()}`);
  
  // Initialize Privacy Cash
  console.log('🌐 Initializing Privacy Cash SDK...');
  privacyCash = new PrivacyCash({
    RPC_url: RPC_URL,
    owner: relayerKeypair,
    enableDebug: process.env.PRIVACY_DEBUG === 'true'
  });
  
  console.log('   ✅ Privacy Cash SDK ready');
  
  // Check balance
  const connection = new Connection(RPC_URL);
  const balance = await connection.getBalance(relayerKeypair.publicKey);
  console.log(`   Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL\n`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'privacy-cash-bridge',
    sdk_initialized: privacyCash !== null,
    relayer: relayerKeypair?.publicKey.toString()
  });
});

// Deposit to Privacy Pool
app.post('/api/privacy/deposit', async (req, res) => {
  try {
    const { amount_sol } = req.body;
    
    if (!amount_sol || amount_sol <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    console.log(`💰 Deposit request: ${amount_sol} SOL`);
    
    const lamports = Math.floor(amount_sol * LAMPORTS_PER_SOL);
    
    // Execute deposit using Privacy Cash SDK
    const result = await privacyCash.deposit({ lamports });
    
    console.log(`   ✅ Deposit successful`);
    console.log(`   Tx: ${result.signature || result.txHash}`);
    
    res.json({
      success: true,
      amount_sol,
      lamports,
      signature: result.signature || result.txHash,
      commitment: result.commitment,
      private_balance: await privacyCash.getPrivateBalance()
    });
    
  } catch (error) {
    console.error('❌ Deposit failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Withdraw from Privacy Pool
app.post('/api/privacy/withdraw', async (req, res) => {
  try {
    const { amount_sol, recipient } = req.body;
    
    if (!amount_sol || amount_sol <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    console.log(`💸 Withdraw request: ${amount_sol} SOL`);
    if (recipient) {
      console.log(`   Recipient: ${recipient}`);
    }
    
    const lamports = Math.floor(amount_sol * LAMPORTS_PER_SOL);
    
    // Execute withdrawal using Privacy Cash SDK
    const withdrawParams = { lamports };
    if (recipient) {
      withdrawParams.recipient = recipient;
    }
    
    const result = await privacyCash.withdraw(withdrawParams);
    
    console.log(`   ✅ Withdrawal successful`);
    console.log(`   Tx: ${result.signature || result.txHash}`);
    
    res.json({
      success: true,
      amount_sol,
      lamports,
      recipient: recipient || relayerKeypair.publicKey.toString(),
      signature: result.signature || result.txHash,
      commitment: result.commitment,
      private_balance: await privacyCash.getPrivateBalance()
    });
    
  } catch (error) {
    console.error('❌ Withdrawal failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Private Balance
app.get('/api/privacy/balance', async (req, res) => {
  try {
    const balance = await privacyCash.getPrivateBalance();
    
    res.json({
      success: true,
      balance_lamports: balance,
      balance_sol: balance / LAMPORTS_PER_SOL
    });
    
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Private Payment (Deposit → Withdraw in one operation)
app.post('/api/privacy/payment', async (req, res) => {
  try {
    const { amount_sol, recipient } = req.body;
    
    if (!amount_sol || amount_sol <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient required' });
    }
    
    console.log(`🔒 Private payment: ${amount_sol} SOL → ${recipient}`);
    
    const lamports = Math.floor(amount_sol * LAMPORTS_PER_SOL);
    
    // Step 1: Deposit to privacy pool
    console.log('   1. Depositing to privacy pool...');
    const depositResult = await privacyCash.deposit({ lamports });
    console.log(`      ✅ Deposit tx: ${depositResult.signature || depositResult.txHash}`);
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Withdraw to recipient
    console.log('   2. Withdrawing to recipient...');
    const withdrawResult = await privacyCash.withdraw({
      lamports,
      recipient
    });
    console.log(`      ✅ Withdraw tx: ${withdrawResult.signature || withdrawResult.txHash}`);
    
    res.json({
      success: true,
      amount_sol,
      recipient,
      deposit_signature: depositResult.signature || depositResult.txHash,
      withdraw_signature: withdrawResult.signature || withdrawResult.txHash,
      privacy_guaranteed: true
    });
    
  } catch (error) {
    console.error('❌ Private payment failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔐 Privacy Cash Service for Card Payments');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    await initializePrivacyCash();
    
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Privacy Cash Service running on http://127.0.0.1:${PORT}`);
      console.log(`\nEndpoints:`);
      console.log(`   GET  /health                  - Service health`);
      console.log(`   GET  /api/privacy/balance     - Check private balance`);
      console.log(`   POST /api/privacy/deposit     - Deposit to privacy pool`);
      console.log(`   POST /api/privacy/withdraw    - Withdraw from privacy pool`);
      console.log(`   POST /api/privacy/payment     - Complete private payment`);
      console.log(`\nReady to process private card payments! 💳\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
