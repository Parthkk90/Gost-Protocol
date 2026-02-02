/**
 * Create a Test Whirlpool on Devnet
 * If no suitable pool exists, this script creates one for testing
 */

import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import { Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as fs from "fs";

// Devnet configuration
const DEVNET_RPC = "https://api.devnet.solana.com";
const ORCA_WHIRLPOOL_CONFIG = new PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR");

// Token addresses
const USDC_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// Fee tier (0.3% = 3000 basis points)
const TICK_SPACING = 64;
const FEE_RATE = 3000;

async function createTestPool() {
  console.log("🏗️  Creating Test Whirlpool on Devnet...\n");
  
  // Load wallet (you need a keypair with devnet SOL)
  let wallet: Wallet;
  try {
    const keypairPath = process.env.HOME + "/.config/solana/id.json";
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
    wallet = new Wallet(keypair);
    console.log("   Wallet: ", wallet.publicKey.toBase58());
  } catch (err) {
    console.error("❌ Failed to load wallet. Set ANCHOR_WALLET or use ~/.config/solana/id.json");
    console.error("   Get devnet SOL: solana airdrop 5");
    process.exit(1);
  }
  
  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  // Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`   Balance: ${balance / 1e9} SOL`);
  
  if (balance < 1e9) {
    console.error("❌ Insufficient balance. Run: solana airdrop 5");
    process.exit(1);
  }
  
  // Initialize Whirlpool context
  const ctx = WhirlpoolContext.withProvider(
    { connection, wallet } as any,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  
  const client = buildWhirlpoolClient(ctx);
  
  console.log("\n📊 Pool Configuration:");
  console.log(`   Token A: USDC (${USDC_DEVNET.toBase58()})`);
  console.log(`   Token B: SOL (${SOL_MINT.toBase58()})`);
  console.log(`   Fee Rate: 0.3% (${FEE_RATE} basis points)`);
  console.log(`   Tick Spacing: ${TICK_SPACING}`);
  
  try {
    // Derive pool address
    const whirlpoolPda = PDAUtil.getWhirlpool(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      ORCA_WHIRLPOOL_CONFIG,
      USDC_DEVNET,
      SOL_MINT,
      TICK_SPACING
    );
    
    console.log(`\n🎯 Pool Address: ${whirlpoolPda.publicKey.toBase58()}`);
    
    // Check if pool already exists
    const existingPool = await connection.getAccountInfo(whirlpoolPda.publicKey);
    if (existingPool) {
      console.log("✅ Pool already exists! No need to create.");
      console.log("\n📝 Use this address in your Rust program:");
      console.log(`   pub const ORCA_POOL: Pubkey = pubkey!("${whirlpoolPda.publicKey.toBase58()}");`);
      return;
    }
    
    console.log("\n🚀 Creating pool (this may take a minute)...");
    
    // Note: Pool creation requires Orca's factory permission on devnet
    // You may need to use Orca's UI or request permission
    console.log("\n⚠️  IMPORTANT:");
    console.log("   Orca Whirlpool creation requires factory permissions on devnet.");
    console.log("   Options:");
    console.log("   1. Use Orca's devnet UI to create the pool");
    console.log("   2. Contact Orca team for devnet factory access");
    console.log("   3. Use existing pools (run discover-orca-pools.ts)");
    console.log("\n   For testing, you can:");
    console.log("   - Use Raydium CLMM instead (more permissionless)");
    console.log("   - Use Meteora DLMM (fully permissionless)");
    console.log("   - Continue with stub functions until mainnet");
    
  } catch (err) {
    console.error("❌ Error creating pool:", err);
    console.error(err.stack);
  }
}

createTestPool().catch(console.error);
