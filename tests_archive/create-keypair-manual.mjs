/**
 * Manual Keypair Creator
 * Creates customer-keypair.json from your private key
 * 
 * SECURITY: This file helps you create the keypair file without needing solana-keygen
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('🔐 Manual Keypair File Creator\n');
console.log('This will create customer-keypair.json for your wallet:');
console.log('GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW\n');

console.log('⚠️  SECURITY WARNING:');
console.log('- Your private key will be stored in customer-keypair.json');
console.log('- Make sure .gitignore includes this file');
console.log('- Never share this file with anyone\n');

console.log('📝 Choose input method:\n');
console.log('1. Paste private key bytes (e.g., [123,45,67,...])');
console.log('2. Paste base58 private key (long string starting with 1-5)');
console.log('3. Enter seed phrase (12 or 24 words)\n');

const method = await question('Enter choice (1/2/3): ');

let secretKey;

if (method === '1') {
  console.log('\n📋 Paste your private key array:');
  console.log('(Should be 64 numbers in brackets, like [123,45,67,...])\n');
  
  const input = await question('Private key: ');
  
  try {
    secretKey = JSON.parse(input);
    
    if (!Array.isArray(secretKey) || secretKey.length !== 64) {
      throw new Error('Invalid format');
    }
  } catch (err) {
    console.error('❌ Invalid private key format!');
    console.error('Expected: [123,45,67,...]');
    process.exit(1);
  }
  
} else if (method === '2') {
  console.log('\n📋 Paste your base58 private key:');
  console.log('(Long string of letters and numbers)\n');
  
  const input = await question('Private key: ');
  
  try {
    // Import bs58 dynamically
    const bs58 = (await import('bs58')).default;
    const decoded = bs58.decode(input.trim());
    secretKey = Array.from(decoded);
    
    if (secretKey.length !== 64) {
      throw new Error('Invalid length');
    }
  } catch (err) {
    console.error('❌ Invalid base58 private key!');
    console.error('Error:', err.message);
    process.exit(1);
  }
  
} else if (method === '3') {
  console.log('\n⚠️  Seed phrase recovery requires @solana/web3.js v1.x');
  console.log('This is complex - use method 1 or 2 instead.');
  console.log('\nTo get your private key array:');
  console.log('1. Import wallet in Phantom/Solflare');
  console.log('2. Export private key');
  console.log('3. Use that with method 1 or 2');
  process.exit(0);
  
} else {
  console.error('❌ Invalid choice');
  process.exit(1);
}

// Verify the keypair
const { Keypair, PublicKey } = await import('@solana/web3.js');

try {
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
  const address = wallet.publicKey.toString();
  
  console.log('\n✅ Valid keypair!');
  console.log('📍 Address:', address);
  
  const expectedAddress = 'GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW';
  
  if (address !== expectedAddress) {
    console.log('\n⚠️  WARNING: Address mismatch!');
    console.log('Expected:', expectedAddress);
    console.log('Got:     ', address);
    
    const confirm = await question('\nContinue anyway? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Cancelled.');
      process.exit(0);
    }
  } else {
    console.log('✅ Address matches expected wallet!');
  }
  
} catch (err) {
  console.error('❌ Invalid private key!');
  console.error('Error:', err.message);
  process.exit(1);
}

// Save to file
const keypairPath = path.join(__dirname, 'customer-keypair.json');

try {
  fs.writeFileSync(keypairPath, JSON.stringify(secretKey));
  console.log('\n✅ Saved to:', keypairPath);
  
  // Check .gitignore
  const gitignorePath = path.join(__dirname, '.gitignore');
  let gitignore = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  if (!gitignore.includes('customer-keypair.json')) {
    console.log('\n⚠️  Adding to .gitignore...');
    fs.appendFileSync(gitignorePath, '\ncustomer-keypair.json\n');
    console.log('✅ Added to .gitignore');
  }
  
  console.log('\n🚀 Ready to test!');
  console.log('\nNext step:');
  console.log('  node safe-test-payment.mjs');
  
} catch (err) {
  console.error('❌ Failed to save file!');
  console.error('Error:', err.message);
  process.exit(1);
}

rl.close();
