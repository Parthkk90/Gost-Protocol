# 🚀 Making Private Transactions from Your Wallet

## Your Wallet
**Address:** `GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW`

## What You Need

### 1. Private Key (Keypair)
To sign transactions FROM this wallet, you need the **private key**.

**If you have the seed phrase:**
```bash
solana-keygen recover -o customer-keypair.json
# Enter your 12/24 word seed phrase when prompted
```

**If you have the private key bytes:**
Create `customer-keypair.json` with your 64-byte array:
```json
[123,45,67,89,...]
```

**If you only have the public key:**
- You CANNOT make transactions (need private key to sign)
- Use a wallet that controls this address (Phantom, Solflare, etc.)
- Export the private key from that wallet

### 2. SOL Balance
Your wallet needs SOL for:
- Payment amount (e.g., 0.001 SOL)
- Privacy Cash fees (~0.011 SOL)
- Total needed: ~0.012 SOL minimum

**Check balance:**
```bash
# Via our system
node -e "const {Connection,PublicKey,LAMPORTS_PER_SOL}=require('@solana/web3.js');(async()=>{const c=new Connection('https://api.mainnet-beta.solana.com');const b=await c.getBalance(new PublicKey('GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW'));console.log('Balance:',b/LAMPORTS_PER_SOL,'SOL')})();"
```

**Fund wallet if needed:**
- Use any wallet app (Phantom, Solflare) to send SOL
- Or from command line:
  ```bash
  solana transfer GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW 0.1 --url mainnet-beta
  ```

---

## How to Make a Private Payment

### Option 1: Using Our Script (Recommended)

1. **Create keypair file:**
   ```bash
   # Place your private key in customer-keypair.json
   # Format: [byte1, byte2, byte3, ..., byte64]
   ```

2. **Run the payment script:**
   ```bash
   node private-payment-from-customer.mjs
   ```

3. **What happens:**
   ```
   Phase 1: Generate secret (ESP32 hardware entropy)
   Phase 2: Shield 0.001 SOL into Privacy Cash pool
   Phase 3: Wait for privacy duration (anonymity set)
   Phase 4: Generate zero-knowledge proof
   Phase 5: Withdraw to merchant (ZK verified)
   
   Result: Merchant receives SOL, you stay private! 🎭
   ```

### Option 2: Using Bridge API Directly

```bash
# Make private payment via API
curl -X POST http://localhost:8080/private-payment \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe",
    "amount": 0.001,
    "customerWallet": "GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW"
  }'
```

### Option 3: From Wallet App (Future)

Once we build the mobile/web interface:
1. Connect your wallet (Phantom, Solflare)
2. Enter merchant address
3. Enter amount
4. Click "Pay Privately"
5. Approve transaction in wallet
6. System handles Privacy Cash flow automatically

---

## Transaction Flow Explained

### What Happens Behind the Scenes:

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR WALLET                                                 │
│ GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW              │
│ Balance: 0.XXX SOL                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 1. Sign shield transaction
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PRIVACY CASH POOL (Mainnet)                                │
│ Program: 9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD     │
│                                                             │
│ • Receives your deposit (0.001 SOL)                        │
│ • Records commitment: hash(secret)                         │
│ • Mixes with other users' deposits                         │
│ • Creates anonymity set                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 2. Wait for anonymity (1-5 min)
                         │ 3. Submit ZK proof
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ MERCHANT RECEIVES PAYMENT                                   │
│ FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe              │
│                                                             │
│ • Gets 0.001 SOL                                           │
│ • Via ZK-verified withdrawal                               │
│ • NO LINK to your wallet!                                  │
│ • Cannot track your identity                               │
└─────────────────────────────────────────────────────────────┘
```

### Privacy Guarantees:

1. **Zero-Knowledge Proof**
   - Proves you have right to withdraw
   - WITHOUT revealing which deposit is yours
   - Mathematical privacy (not just obfuscation)

2. **Unlinkable Transactions**
   - Blockchain sees: Deposit commitment
   - Blockchain sees: Withdrawal with proof
   - Blockchain CANNOT see: The link between them!

3. **Anonymity Set**
   - Your deposit mixes with all Privacy Cash users
   - Larger pool = stronger privacy
   - Merchant sees: Payment from privacy pool
   - Merchant CANNOT see: Your wallet address

4. **Audited Security**
   - Accretion: Smart contract audit
   - HashCloak: Zero-knowledge cryptography
   - Zigtur: Blockchain protocol
   - Kriko: Privacy analysis

---

## Transaction Costs

| Operation | Cost (SOL) | Cost (USD @$25) | Purpose |
|-----------|-----------|-----------------|---------|
| Shield (deposit) | 0.001 | $0.025 | Solana transaction fee |
| ZK Compute | 0.005 | $0.125 | Proof verification compute |
| Withdraw | 0.005 | $0.125 | Withdrawal transaction |
| **Total** | **0.011** | **~$0.28** | Per private payment |

**Plus:** Your payment amount (e.g., 0.001 SOL to merchant)

**Total needed:** Payment + 0.011 SOL

---

## Security Checklist

### Before Making Payment:

- [ ] **Have private key** (customer-keypair.json)
- [ ] **Check balance** (enough for payment + fees)
- [ ] **Verify merchant address** (correct recipient)
- [ ] **Bridge service running** (`npm start`)
- [ ] **Mainnet configuration** (check .env file)

### Safety Tips:

1. **Never share private key**
   - Keep customer-keypair.json secure
   - Don't commit to git
   - Don't share with anyone

2. **Verify addresses carefully**
   - Double-check merchant address
   - One wrong character = lost funds

3. **Test with small amount first**
   - Try 0.001 SOL first
   - Verify it works before larger payments

4. **Check transaction on explorer**
   - View on Solscan after completion
   - Verify merchant received payment
   - Confirm no link to your wallet

---

## Troubleshooting

### Error: "Customer keypair not found"
**Solution:** Create `customer-keypair.json` with your private key

### Error: "Insufficient balance"
**Solution:** Fund wallet with SOL
```bash
# Check balance
node -e "const {Connection,PublicKey,LAMPORTS_PER_SOL}=require('@solana/web3.js');(async()=>{const c=new Connection('https://api.mainnet-beta.solana.com');const b=await c.getBalance(new PublicKey('GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW'));console.log(b/LAMPORTS_PER_SOL,'SOL')})();"
```

### Error: "Keypair mismatch"
**Solution:** Make sure the keypair file matches your wallet address

### Error: "Bridge service not healthy"
**Solution:**
```bash
npm start
```

### Error: "ESP32 not responding"
**Impact:** LOW - System uses software entropy (secure)
**Solution:** Optional - fix ESP32 connection or continue without it

---

## Example: Complete Transaction

```bash
# 1. Check your wallet balance
node -e "const {Connection,PublicKey,LAMPORTS_PER_SOL}=require('@solana/web3.js');(async()=>{const c=new Connection('https://api.mainnet-beta.solana.com');const b=await c.getBalance(new PublicKey('GoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXogeFCN3oQW'));console.log('Balance:',b/LAMPORTS_PER_SOL,'SOL')})();"

# Output: Balance: 0.015 SOL (example)

# 2. Create keypair file (if not exists)
# Put your private key in customer-keypair.json

# 3. Verify bridge is running
curl http://localhost:8080/health

# 4. Make private payment
node private-payment-from-customer.mjs

# 5. Transaction completes:
# ═══════════════════════════════════════
#   ✅ PRIVATE PAYMENT COMPLETE!
# ═══════════════════════════════════════
# 
# Payment Details:
#   Customer: GoyTutXw6LdmYVUqRhgC...
#   Merchant: FEEVdMzQFUEZQuX9nUtN...
#   Amount: 0.001 SOL
#   Cost: ~0.011 SOL (fees)
# 
# Privacy Features:
#   ✅ Zero-Knowledge Proof: Verified
#   ✅ Unlinkable: Cannot be traced
#   ✅ Anonymous: Merchant blind
#   ✅ Audited: 4 security firms
```

---

## Viewing Your Transaction

After payment completes, you'll get two transaction links:

### Shield Transaction:
```
https://solscan.io/tx/SHIELD_SIGNATURE_HERE
```
Shows: Your deposit into Privacy Cash pool

### Withdraw Transaction:
```
https://solscan.io/tx/WITHDRAW_SIGNATURE_HERE
```
Shows: Withdrawal to merchant (NO LINK to you!)

**Privacy Check:**
- Open both transactions on Solscan
- Notice: No visible connection between them
- The ZK proof hides the link!

---

## What You Need Right Now

1. **Immediate:**
   - [ ] Get private key for wallet GoyTutXw6LdmYVUqRhgC...
   - [ ] Create `customer-keypair.json` file
   - [ ] Verify wallet has SOL balance

2. **Then:**
   ```bash
   node private-payment-from-customer.mjs
   ```

3. **Result:**
   - Private payment to merchant ✅
   - Zero-knowledge proof ✅
   - Complete anonymity ✅
   - Audited security ✅

---

## Questions?

**Can merchant see my wallet?**  
No! Merchant only sees payment from Privacy Cash pool.

**Is this really private?**  
Yes! Mathematical privacy via zero-knowledge proofs (not obfuscation).

**Can this be traced?**  
No! Even with full blockchain access, cannot link deposit to withdrawal.

**Who audited this?**  
Privacy Cash audited by 4 firms: Accretion, HashCloak, Zigtur, Kriko.

**What if ESP32 is offline?**  
System uses secure software entropy. ESP32 is optional enhancement.

---

**Ready to make your first private payment? Get your keypair file ready and run the script!** 🚀
