# 🚀 How to Execute Transaction on Mainnet

## Problem: `solana-keygen` Not Found

The Solana CLI tools are in your project but not in your system PATH.

---

## Solution 1: Use Project's Solana CLI (RECOMMENDED)

### Find the binary:

```powershell
# Your project has Solana CLI here:
.\solana-program\solana-release\bin\solana-keygen.exe
```

### Create keypair:

```powershell
# Use full path to the binary
.\solana-program\solana-release\bin\solana-keygen.exe recover -o customer-keypair.json
```

You'll be prompted to enter your 12 or 24 word seed phrase.

---

## Solution 2: Manual Keypair Creation (EASIER)

I created a helper script that lets you paste your private key directly:

```powershell
node create-keypair-manual.mjs
```

### Input Methods:

**Method 1: Private Key Array** (Most Common)
```
[123,45,67,89,10,234,156,78,...]
```

**Method 2: Base58 String**
```
5J8QhU9...long string...
```

### Where to Get Your Private Key:

#### From Phantom Wallet:
1. Open Phantom
2. Settings → Show Private Key
3. Enter password
4. Copy the array or string

#### From Solflare:
1. Open Solflare
2. Settings → Export Private Key
3. Enter password
4. Copy the key

#### From Solana CLI (if you have it elsewhere):
```bash
solana-keygen pubkey customer-keypair.json --outfile /dev/stdout
```

---

## Solution 3: Add Solana to PATH

### Temporary (Current Session):

```powershell
$env:PATH += ";F:\W3\gost_protocol\solana-program\solana-release\bin"
solana-keygen recover -o customer-keypair.json
```

### Permanent (System-wide):

```powershell
# Run as Administrator
[Environment]::SetEnvironmentVariable(
    "PATH",
    $env:PATH + ";F:\W3\gost_protocol\solana-program\solana-release\bin",
    [EnvironmentVariableTarget]::User
)

# Restart PowerShell, then:
solana-keygen recover -o customer-keypair.json
```

---

## After Creating customer-keypair.json

### Verify it was created:

```powershell
dir customer-keypair.json
# Should show the file
```

### Check .gitignore:

```powershell
cat .gitignore | Select-String "customer-keypair"
# Should show: customer-keypair.json
```

### Verify the address:

```powershell
node -e "const fs=require('fs');const {Keypair}=require('@solana/web3.js');const k=Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync('customer-keypair.json'))));console.log(k.publicKey.toString())"
```

**Expected output:**
```
GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW
```

---

## Execute the Test Transaction

### Run the safe test (sends to yourself):

```powershell
node safe-test-payment.mjs
```

### What Will Happen:

```
Phase 1: Loading Wallet
  ✅ Address: GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW
  ✅ Balance: 0.035 SOL

Phase 2: Generate Privacy Secret
  ✅ Hardware entropy generated
  ✅ Secret: 0x1a2b3c...

Phase 3: Shield (Deposit)
  💰 Depositing 0.008 SOL to Privacy Cash pool
  ✅ Transaction: 2ZE7...XyJ4
  ✅ View: https://solscan.io/tx/2ZE7...XyJ4

Phase 4: Privacy Duration
  ⏳ Waiting 120 seconds for anonymity...
  [Progress bar]

Phase 5: Withdraw (to yourself)
  💸 Withdrawing 0.008 SOL to GoyTutXw6...
  ✅ ZK proof generated
  ✅ Transaction: 3DF8...KpL9
  ✅ View: https://solscan.io/tx/3DF8...KpL9

✅ TEST COMPLETE!
  Initial: 0.035 SOL
  Final:   ~0.024 SOL
  Cost:    ~0.011 SOL (fees only)
  Received back: 0.008 SOL
```

---

## Understanding the Test

### Why Send to Yourself?

1. **Proves System Works**
   - Full Privacy Cash flow executes
   - ZK proofs verify on-chain
   - No bugs or errors

2. **Zero Risk**
   - Funds come back to you
   - Only lose transaction fees
   - Can't lose 0.008 SOL

3. **Cost Transparency**
   - See exact fee amounts
   - Understand gas costs
   - Budget for real payments

### What the Test Proves:

- ✅ Your keypair works
- ✅ Privacy Cash integration functional
- ✅ Shield operation works (deposit)
- ✅ ZK proof generation works
- ✅ Withdraw operation works
- ✅ Mainnet deployment operational
- ✅ Transaction unlinkability
- ✅ Privacy features active

---

## After Successful Test

### Make Real Payments:

Edit [safe-test-payment.mjs](safe-test-payment.mjs):

```javascript
// Change recipient from yourself to merchant:
const RECIPIENT = 'FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe';
```

Or use the full payment script:

```powershell
node private-payment-from-customer.mjs
```

### Verify on Solscan:

1. Copy transaction signature from terminal
2. Visit: https://solscan.io/tx/YOUR_SIGNATURE
3. Check:
   - ✅ Status: Success
   - ✅ Fee amount
   - ✅ Program interactions
   - ✅ Privacy Cash program calls

---

## Cost Breakdown

### Test Transaction (Send to Self):

| Operation | Cost | Purpose |
|-----------|------|---------|
| Shield (Deposit) | ~0.001 SOL | Create commitment |
| Compute | ~0.005 SOL | ZK proof verification |
| Withdraw | ~0.005 SOL | Nullifier + transfer |
| **Total** | **~0.011 SOL** | **You get 0.008 back** |

### Real Payment (Send to Merchant):

| Operation | Cost | Purpose |
|-----------|------|---------|
| Shield | ~0.001 SOL | Create commitment |
| Compute | ~0.005 SOL | ZK proof verification |
| Withdraw | ~0.005 SOL | Nullifier + transfer |
| Payment | 0.001+ SOL | To merchant |
| **Total** | **~0.012+ SOL** | **Merchant receives amount** |

---

## Troubleshooting

### Error: "Cannot find module 'bs58'"

```powershell
npm install bs58
```

### Error: "customer-keypair.json not found"

Make sure you created the file:
```powershell
dir customer-keypair.json
```

### Error: "Invalid secret key"

Your keypair file is corrupted or wrong format. Should be:
```json
[123,45,67,89,...]
```
Array of 64 numbers.

### Error: "Insufficient funds"

Your wallet needs more SOL:
```
Current: 0.035 SOL
Needed:  0.012+ SOL per transaction
```

### Transaction Shows "Failed"

Check the error on Solscan:
1. Visit: https://solscan.io/tx/SIGNATURE
2. Look at "Logs" section
3. Common issues:
   - Slippage tolerance
   - Compute budget exceeded
   - Account not initialized

---

## Security Checklist

Before running transaction:

- [ ] customer-keypair.json created securely
- [ ] File added to .gitignore
- [ ] Verified wallet address matches
- [ ] Bridge service running (port 8080)
- [ ] Sufficient balance (0.035 SOL confirmed)
- [ ] Understand the costs (~0.011 SOL)
- [ ] Private key never shared with anyone

After transaction:

- [ ] Transaction succeeded on Solscan
- [ ] Received expected amount (for test: 0.008 SOL back)
- [ ] Fee costs match expectations
- [ ] Privacy features verified
- [ ] Delete customer-keypair.json if not needed anymore

---

## Quick Reference

### Create Keypair:
```powershell
node create-keypair-manual.mjs
```

### Test Transaction:
```powershell
node safe-test-payment.mjs
```

### Real Payment:
```powershell
node private-payment-from-customer.mjs
```

### Check Balance:
```powershell
node -e "const {Connection,PublicKey}=require('@solana/web3.js');(async()=>{const c=new Connection('https://api.mainnet-beta.solana.com');const b=await c.getBalance(new PublicKey('GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW'));console.log((b/1e9)+' SOL')})()"
```

### View on Solscan:
```
https://solscan.io/account/GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW
```

---

## 🎯 Summary

1. **Create keypair**: `node create-keypair-manual.mjs` (paste your private key)
2. **Verify file**: `dir customer-keypair.json`
3. **Run test**: `node safe-test-payment.mjs`
4. **Check result**: Visit Solscan link from output
5. **Make payments**: Edit recipient in script

**Your private key stays on your computer. Transactions execute on Solana mainnet with full ZK-proof privacy!** 🚀
