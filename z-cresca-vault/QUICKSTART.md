# Z-CRESCA QUICK START GUIDE

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Prerequisites

```bash
# Check Rust
rustc --version
# Should show: rustc 1.75+ 

# Check Solana
solana --version
# Should show: solana-cli 1.18+

# Check Anchor
anchor --version
# Should show: anchor-cli 0.32.1
```

**Don't have these?** Run:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1
```

---

### Step 2: Build the Program

```bash
cd z-cresca-vault
anchor build
```

**Expected Output:**
```
   Compiling z_cresca_vault v0.1.0
    Finished release [optimized] target(s) in 45.3s
```

---

### Step 3: Run Tests (Coming Soon)

```bash
anchor test
```

---

### Step 4: Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Create a keypair (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Airdrop some SOL for deployment
solana airdrop 2

# Deploy the program
anchor deploy
```

**Expected Output:**
```
Program Id: ZCrVau1tYqK7X2MpF9V8Z3mY4hR5wN6sT8dL1pQwR2z
```

---

## 🧪 Test the Program

### Initialize Protocol (Admin)

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZCrescaVault } from "../target/types/z_cresca_vault";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.ZCrescaVault as Program<ZCrescaVault>;

// Initialize global state
await program.methods
  .initializeGlobalState(
    150,  // 1.5x LTV
    200   // 2% base interest
  )
  .accounts({
    authority: provider.wallet.publicKey,
    treasury: provider.wallet.publicKey, // For now
  })
  .rpc();

console.log("✅ Protocol initialized!");
```

### Create a Vault

```typescript
const vaultId = new anchor.BN(0);

const [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [
    Buffer.from("vault"),
    provider.wallet.publicKey.toBuffer(),
    vaultId.toArrayLike(Buffer, "le", 8),
  ],
  program.programId
);

await program.methods
  .initializeVault(vaultId)
  .accounts({
    vault: vaultPda,
    owner: provider.wallet.publicKey,
    collateralMint: USDC_MINT, // Devnet USDC
  })
  .rpc();

console.log("✅ Vault created:", vaultPda.toBase58());
```

### Deposit Collateral

```typescript
await program.methods
  .depositCollateral(new anchor.BN(1_000_000_000)) // 1000 USDC
  .accounts({
    vault: vaultPda,
    owner: provider.wallet.publicKey,
    ownerTokenAccount: userUsdcAccount,
    vaultTokenAccount: vaultUsdcAccount,
  })
  .rpc();

console.log("✅ Deposited 1000 USDC");

// Check credit limit
const vault = await program.account.creditVault.fetch(vaultPda);
console.log("Credit Limit:", vault.creditLimit.toNumber() / 1e6, "USDC");
console.log("Available:", vault.availableCredit() / 1e6, "USDC");
```

### Authorize a Payment

```typescript
const approved = await program.methods
  .authorizePayment(
    new anchor.BN(50_000_000), // $50
    merchantPubkey
  )
  .accounts({
    vault: vaultPda,
    merchant: merchantPubkey,
    relayer: relayerKeypair.publicKey,
  })
  .signers([relayerKeypair])
  .rpc();

console.log(approved ? "✅ APPROVED" : "❌ DECLINED");
```

---

## 📊 Check Your Vault

```typescript
const vault = await program.account.creditVault.fetch(vaultPda);

console.log("=== Vault Status ===");
console.log("Collateral:", vault.collateralAmount.toNumber() / 1e6, "USDC");
console.log("Credit Limit:", vault.creditLimit.toNumber() / 1e6, "USDC");
console.log("Outstanding:", vault.outstandingBalance.toNumber() / 1e6, "USDC");
console.log("Available:", vault.availableCredit() / 1e6, "USDC");
console.log("Utilization:", vault.utilizationRatio() / 100, "%");
console.log("Interest Rate:", vault.currentInterestRate / 100, "% APR");
console.log("Daily Spent:", vault.dailySpent.toNumber() / 1e6, "USDC");
```

---

## 🔍 Troubleshooting

### Error: "Program not found"
**Solution**: Make sure you deployed to the correct cluster:
```bash
solana config get
# Should show: RPC URL: https://api.devnet.solana.com
```

### Error: "Insufficient funds"
**Solution**: Airdrop more SOL:
```bash
solana airdrop 2
```

### Error: "Account not found"
**Solution**: Initialize global state first (admin only):
```typescript
await program.methods.initializeGlobalState(150, 200).rpc();
```

### Build Error: "blake3 requires edition2024"
**Solution**: Pin blake3 version in `Cargo.toml`:
```toml
blake3 = "=1.5.5"
```

---

## 🎯 Next Steps

1. **Write Tests**: Create `tests/z_cresca_vault.ts`
2. **Integrate Hyperion**: Add CLMM yield generation
3. **Add Privacy**: Implement ZK proofs with Noir
4. **Build UI**: Create dashboard for users
5. **Security Audit**: Before mainnet deployment

---

## 📚 Resources

- [Anchor Book](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Z-Cresca Roadmap](./Z_CRESCA_ROADMAP.md)
- [Implementation Status](./IMPLEMENTATION_STATUS.md)

---

## 💬 Get Help

- GitHub Issues: [Report Bug]
- Discord: [Join Server]
- Docs: [Read Full Documentation]

---

**Happy Building!** 🚀
