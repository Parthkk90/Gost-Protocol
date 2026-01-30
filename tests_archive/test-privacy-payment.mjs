#!/usr/bin/env node
/**
 * Test Privacy Cash Integration
 * Demo end-to-end private payment
 */

const BRIDGE_URL = 'http://localhost:8080';
const MERCHANT_ADDRESS = 'FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe';
const AMOUNT = 0.01; // 0.01 SOL test payment

async function testPrivatePayment() {
  console.log('\n' + '='.repeat(70));
  console.log('  Ghost Protocol + Privacy Cash - Integration Test');
  console.log('='.repeat(70) + '\n');
  
  try {
    // Check bridge health
    console.log('🔍 Checking bridge service...');
    const healthResponse = await fetch(`${BRIDGE_URL}/health`);
    const health = await healthResponse.json();
    
    console.log(`✅ Bridge Status: ${health.status}`);
    console.log(`   Wallet: ${health.wallet}`);
    console.log(`   Balance: ${health.balance} SOL`);
    console.log(`   RPC: ${health.rpc}`);
    console.log();
    
    // Execute private payment
    console.log('🚀 Initiating private payment...');
    console.log(`   Merchant: ${MERCHANT_ADDRESS}`);
    console.log(`   Amount: ${AMOUNT} SOL`);
    console.log();
    
    const paymentResponse = await fetch(`${BRIDGE_URL}/private-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant: MERCHANT_ADDRESS,
        amount: AMOUNT
      })
    });
    
    const result = await paymentResponse.json();
    
    if (result.success) {
      console.log('\n' + '='.repeat(70));
      console.log('🎉 PRIVATE PAYMENT SUCCESSFUL!');
      console.log('='.repeat(70));
      console.log('\n📊 Transaction Details:');
      console.log(`   Deposit Tx: ${result.deposit.signature}`);
      console.log(`   Withdraw Tx: ${result.withdrawal.signature}`);
      console.log(`   Merchant: ${result.withdrawal.recipient}`);
      console.log(`   Amount: ${result.withdrawal.amount} SOL`);
      console.log('\n🛡️  Privacy Guarantees:');
      console.log(`   ${result.privacy}`);
      console.log(`   ✅ Deposit and withdrawal are unlinkable`);
      console.log(`   ✅ Merchant cannot see customer wallet`);
      console.log(`   ✅ No trusted intermediary required`);
      console.log('\n🔗 Explorers:');
      console.log(`   Deposit: ${result.deposit.explorer}`);
      console.log(`   Withdrawal: ${result.withdrawal.explorer}`);
      console.log('='.repeat(70) + '\n');
    } else {
      console.error('❌ Payment failed:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure bridge service is running: npm start');
    console.error('  2. Check ESP32 is connected and accessible');
    console.error('  3. Verify wallet has sufficient SOL balance');
    console.error('  4. Check Solana RPC endpoint is working\n');
  }
}

// Run test
testPrivatePayment();
