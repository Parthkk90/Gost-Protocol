#!/usr/bin/env node
/**
 * Ghost Protocol + Privacy Cash Integration
 * Bridge service for private payments using Privacy Cash SDK
 * MAINNET DEPLOYMENT
 */

import { PrivacyCash } from 'privacycash';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Configuration - MAINNET BY DEFAULT
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const ESP32_HOST = process.env.ESP32_HOST || '10.214.161.157';
const PORT = process.env.PORT || 8080;
const NETWORK = process.env.NETWORK || 'mainnet';

// Validate mainnet configuration
if (SOLANA_RPC.includes('devnet')) {
  console.warn('⚠️  WARNING: Using devnet RPC. For mainnet, set SOLANA_RPC=https://api.mainnet-beta.solana.com');
}

console.log(`[Network] ${NETWORK.toUpperCase()} - ${SOLANA_RPC}`);


// Load wallet (for bridge operations, not for signing user transactions)
function loadWallet() {
  const keypairPath = path.join(__dirname, 'solana-relayer/relayer-keypair.json');
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

const bridgeWallet = loadWallet();
console.log(`[Bridge] Wallet: ${bridgeWallet.publicKey.toString()}`);

// Initialize Privacy Cash SDK
const privacyCash = new PrivacyCash({
  RPC_url: SOLANA_RPC,
  owner: bridgeWallet,
  enableDebug: true
});

console.log('[Privacy Cash] SDK initialized');
 

// Express server
const app = express();
app.use(express.json());

// Statistics
const stats = {
  deposits: 0,
  withdrawals: 0,
  totalVolume: 0
};

/**
 * GET /health
 * Check service health
 */
app.get('/health', async (req, res) => {
  try {
    const connection = new Connection(SOLANA_RPC);
    const balance = await connection.getBalance(bridgeWallet.publicKey);
    
    res.json({
      status: 'healthy',
      wallet: bridgeWallet.publicKey.toString(),
      balance: balance / 1e9,
      rpc: SOLANA_RPC,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * POST /generate-secret
 * Generate secret using ESP32 hardware entropy (with software fallback)
 */
app.post('/generate-secret', async (req, res) => {
  try {
    console.log('[ESP32] Requesting hardware entropy...');
    
    try {
      // Try ESP32 first
      const response = await fetch(`http://${ESP32_HOST}/entropy?bytes=32`, {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        const entropy = data.entropy;
        
        console.log(`[ESP32] ✅ Hardware entropy: ${entropy.substring(0, 16)}...`);
        
        return res.json({
          success: true,
          secret: entropy,
          source: 'ESP32 Hardware RNG'
        });
      }
    } catch (esp32Error) {
      console.warn('[ESP32] ⚠️  Not available, using software fallback');
    }
    
    // Fallback: Use crypto.randomBytes (secure software RNG)
    const { randomBytes } = await import('crypto');
    const entropy = '0x' + randomBytes(32).toString('hex');
    
    console.log(`[Software] ✅ Generated entropy: ${entropy.substring(0, 16)}...`);
    
    res.json({
      success: true,
      secret: entropy,
      source: 'Crypto.randomBytes (Software)'
    });
    
  } catch (error) {
    console.error('[Secret] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /shield
 * Deposit SOL into Privacy Cash pool
 */
app.post('/shield', async (req, res) => {
  try {
    const { amount, secret } = req.body;
    
    if (!amount || !secret) {
      return res.status(400).json({
        success: false,
        error: 'Missing amount or secret'
      });
    }
    
    console.log(`[Privacy Cash] Shielding ${amount} SOL...`);
    
    // Use Privacy Cash SDK to deposit
    const result = await privacyCash.deposit({
      amount: amount * 1e9, // Convert SOL to lamports
      secret: secret
    });
    
    stats.deposits++;
    stats.totalVolume += amount;
    
    console.log(`[Privacy Cash] ✅ Deposit successful: ${result.signature}`);
    
    res.json({
      success: true,
      signature: result.signature,
      commitment: result.commitment,
      secret: secret,
      explorer: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`
    });
    
  } catch (error) {
    console.error('[Privacy Cash] Deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /withdraw
 * Withdraw SOL from Privacy Cash pool to merchant
 */
app.post('/withdraw', async (req, res) => {
  try {
    const { recipient, amount, secret } = req.body;
    
    if (!recipient || !amount || !secret) {
      return res.status(400).json({
        success: false,
        error: 'Missing recipient, amount, or secret'
      });
    }
    
    console.log(`[Privacy Cash] Withdrawing ${amount} SOL to ${recipient}...`);
    
    // Use Privacy Cash SDK to withdraw
    const result = await privacyCash.withdraw({
      recipient: new PublicKey(recipient),
      amount: amount * 1e9, // Convert SOL to lamports
      secret: secret
    });
    
    stats.withdrawals++;
    
    console.log(`[Privacy Cash] ✅ Withdrawal successful: ${result.signature}`);
    
    res.json({
      success: true,
      signature: result.signature,
      recipient: recipient,
      amount: amount,
      explorer: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`
    });
    
  } catch (error) {
    console.error('[Privacy Cash] Withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /private-payment
 * Complete private payment flow (deposit if needed, then withdraw to merchant)
 */
app.post('/private-payment', async (req, res) => {
  try {
    const { merchant, amount, customerWallet } = req.body;
    
    if (!merchant || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing merchant or amount'
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎭 Ghost Protocol Private Payment');
    console.log('='.repeat(60));
    console.log(`Merchant: ${merchant}`);
    console.log(`Amount: ${amount} SOL`);
    console.log('='.repeat(60) + '\n');
    
    // Step 1: Generate secret from ESP32
    console.log('Step 1: Generating hardware entropy...');
    const secretResponse = await fetch(`http://localhost:${PORT}/generate-secret`, {
      method: 'POST'
    });
    const { secret } = await secretResponse.json();
    console.log(`✅ Secret: ${secret.substring(0, 16)}...`);
    
    // Step 2: Shield (deposit) into Privacy Cash
    console.log('\nStep 2: Shielding SOL into privacy pool...');
    const shieldResponse = await fetch(`http://localhost:${PORT}/shield`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, secret })
    });
    const shieldResult = await shieldResponse.json();
    
    if (!shieldResult.success) {
      throw new Error(`Shield failed: ${shieldResult.error}`);
    }
    
    console.log(`✅ Shielded: ${shieldResult.signature}`);
    console.log(`   Explorer: ${shieldResult.explorer}`);
    
    // Wait a bit for confirmation
    console.log('\nWaiting for confirmation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 3: Withdraw to merchant
    console.log('\nStep 3: Private withdrawal to merchant...');
    const withdrawResponse = await fetch(`http://localhost:${PORT}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: merchant, amount, secret })
    });
    const withdrawResult = await withdrawResponse.json();
    
    if (!withdrawResult.success) {
      throw new Error(`Withdrawal failed: ${withdrawResult.error}`);
    }
    
    console.log(`✅ Payment complete: ${withdrawResult.signature}`);
    console.log(`   Explorer: ${withdrawResult.explorer}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Private Payment Successful!');
    console.log('='.repeat(60));
    console.log(`✅ Merchant received: ${amount} SOL`);
    console.log(`🛡️  Customer identity: PRIVATE (ZK-proof verified)`);
    console.log(`🔗 Deposit/Withdrawal: UNLINKABLE`);
    console.log('='.repeat(60) + '\n');
    
    res.json({
      success: true,
      deposit: shieldResult,
      withdrawal: withdrawResult,
      privacy: 'Zero-knowledge proof verified on-chain'
    });
    
  } catch (error) {
    console.error('[Private Payment] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /stats
 * Get bridge statistics
 */
app.get('/stats', (req, res) => {
  res.json(stats);
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('  Ghost Protocol + Privacy Cash Bridge');
  console.log('='.repeat(60));
  console.log(`🔗 Bridge Wallet: ${bridgeWallet.publicKey.toString()}`);
  console.log(`🌐 Solana RPC: ${SOLANA_RPC}`);
  console.log(`🔧 ESP32 Host: ${ESP32_HOST}`);
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log('\nAPI Endpoints:');
  console.log('  POST /generate-secret   - Get ESP32 hardware entropy');
  console.log('  POST /shield            - Deposit into privacy pool');
  console.log('  POST /withdraw          - Withdraw to merchant');
  console.log('  POST /private-payment   - Complete private payment');
  console.log('  GET  /health            - Service health check');
  console.log('  GET  /stats             - Statistics');
  console.log('='.repeat(60) + '\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error('Kill the existing process:');
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`   taskkill /PID <PID> /F\n`);
  } else {
    console.error(`\n❌ Server error:`, error.message);
  }
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down bridge service...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
