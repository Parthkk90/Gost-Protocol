/**
 * Orca Whirlpools Pool Discovery Script
 * Finds suitable USDC-SOL pools on devnet for Z-Cresca integration
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import Decimal from "decimal.js";

// Devnet configuration
const DEVNET_RPC = "https://api.devnet.solana.com";
const ORCA_WHIRLPOOL_CONFIG = new PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR"); // Orca devnet config

// Known devnet token addresses
const USDC_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Circle USDC devnet
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112"); // Wrapped SOL

async function discoverPools() {
  console.log("🔍 Discovering Orca Whirlpools on Devnet...\n");
  
  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  // Create a dummy wallet for read-only operations
  const dummyKeypair = Keypair.generate();
  const wallet = new Wallet(dummyKeypair);
  
  // Initialize Whirlpool context with proper AnchorProvider
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  
  // WhirlpoolContext.withProvider only takes provider, uses default program ID
  const ctx = WhirlpoolContext.withProvider(provider);
  
  const client = buildWhirlpoolClient(ctx);
  
  console.log("📊 Configuration:");
  console.log(`   RPC: ${DEVNET_RPC}`);
  console.log(`   Orca Program: ${ORCA_WHIRLPOOL_PROGRAM_ID.toBase58()}`);
  console.log(`   USDC: ${USDC_DEVNET.toBase58()}`);
  console.log(`   SOL: ${SOL_MINT.toBase58()}\n`);
  
  try {
    // Method 1: Try to find pools by fetching all pools for the config
    console.log("🔎 Searching for USDC-SOL pools...\n");
    
    // Derive common fee tier pool addresses
    const feeTiers = [
      { fee: 128, name: "0.01%" },   // 1 basis point
      { fee: 300, name: "0.03%" },   // 3 basis points
      { fee: 3000, name: "0.3%" },   // 30 basis points
      { fee: 10000, name: "1%" }     // 100 basis points
    ];
    
    for (const tier of feeTiers) {
      try {
        // Try to derive pool address
        const [poolPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("whirlpool"),
            ORCA_WHIRLPOOL_CONFIG.toBuffer(),
            USDC_DEVNET.toBuffer(),
            SOL_MINT.toBuffer(),
            Buffer.from([tier.fee & 0xFF, (tier.fee >> 8) & 0xFF])
          ],
          ORCA_WHIRLPOOL_PROGRAM_ID
        );
        
        console.log(`   Trying ${tier.name} fee tier pool: ${poolPda.toBase58()}`);
        
        // Try to fetch pool data
        const poolData = await connection.getAccountInfo(poolPda);
        
        if (poolData) {
          console.log(`   ✅ FOUND! Pool exists with ${poolData.data.length} bytes`);
          
          try {
            const pool = await client.getPool(poolPda);
            const tokenA = await pool.getTokenAInfo();
            const tokenB = await pool.getTokenBInfo();
            const poolDataObj = pool.getData();
            
            console.log(`   📈 Pool Details:`);
            console.log(`      Address: ${poolPda.toBase58()}`);
            console.log(`      Token A: ${tokenA.mint.toBase58()}`);
            console.log(`      Token B: ${tokenB.mint.toBase58()}`);
            console.log(`      Fee Rate: ${tier.name}`);
            console.log(`      Tick Spacing: ${poolDataObj.tickSpacing}`);
            console.log(`\n`);
          } catch (parseErr: any) {
            console.log(`   ⚠️  Pool exists but couldn't parse full details: ${parseErr.message}`);
          }
        } else {
          console.log(`   ❌ Pool does not exist\n`);
        }
      } catch (err: any) {
        console.log(`   ❌ Error checking pool: ${err.message}\n`);
      }
    }
    
    // Method 2: List all whirlpool accounts
    console.log("\n🗂️  Fetching all Whirlpool accounts...");
    const allPools = await connection.getProgramAccounts(ORCA_WHIRLPOOL_PROGRAM_ID, {
      filters: [
        { dataSize: 653 } // Whirlpool account size
      ]
    });
    
    console.log(`   Found ${allPools.length} total whirlpool accounts\n`);
    
    if (allPools.length > 0) {
      console.log("   Sample pools:");
      for (let i = 0; i < Math.min(5, allPools.length); i++) {
        console.log(`   ${i + 1}. ${allPools[i].pubkey.toBase58()}`);
      }
      
      console.log("\n💡 Use these addresses in your program's remaining_accounts");
      console.log("   when calling deposit_to_clmm instruction.\n");
    }
    
  } catch (err: any) {
    console.error("❌ Error discovering pools:", err);
    if (err.stack) console.error(err.stack);
  }
  
  console.log("\n✅ Discovery complete!");
  console.log("\n📝 Next Steps:");
  console.log("   1. If no pools found, create a test pool using Orca SDK");
  console.log("   2. Update your Rust program with the pool address");
  console.log("   3. Implement CPI instructions to interact with the pool");
  console.log("   4. Test position creation and fee collection");
}

discoverPools().catch(console.error);
