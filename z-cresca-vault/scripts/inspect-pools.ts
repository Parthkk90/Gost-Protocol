/**
 * Inspect Existing Orca Pools on Devnet
 * Fetches details about sample pools to find usable ones
 */

import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID } from "@orca-so/whirlpools-sdk";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { getMint } from "@solana/spl-token";

const DEVNET_RPC = "https://api.devnet.solana.com";

// Sample pools from discovery
const SAMPLE_POOLS = [
  "AdFMrN9XVBxPuwhsLnmrkX7fs7XV6V9ZqZMvN2dXoroC",
  "7M1pY27zjZpX4jjobRjoUvbpd2vX56TMBJngFeJJMX2c",
  "DHqM1MHnthD6bPtqyQ2hF3bPjKN7hJgAS1JKi1wKCjLW",
  "GoqqtsmxYUmGuyNcdTc5mxKjce6jfSHZKCjhqBQbPrDw",
  "5i7RkM3hPTcq31iEPk1tQkcUJaP2ejfJmSfu6oxvQKDx",
];

async function inspectPools() {
  console.log("🔬 Inspecting Orca Pools on Devnet...\n");
  
  const connection = new Connection(DEVNET_RPC, "confirmed");
  
  const dummyKeypair = Keypair.generate();
  const wallet = new Wallet(dummyKeypair);
  
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  
  const ctx = WhirlpoolContext.withProvider(provider);
  const client = buildWhirlpoolClient(ctx);
  
  for (let i = 0; i < SAMPLE_POOLS.length; i++) {
    try {
      const poolAddress = new PublicKey(SAMPLE_POOLS[i]);
      console.log(`\n📊 Pool ${i + 1}: ${poolAddress.toBase58()}`);
      
      const pool = await client.getPool(poolAddress);
      const poolData = pool.getData();
      
      console.log(`   Tick Spacing: ${poolData.tickSpacing}`);
      console.log(`   Fee Rate: ${poolData.feeRate / 100}%`);
      console.log(`   Protocol Fee Rate: ${poolData.protocolFeeRate / 100}%`);
      console.log(`   Liquidity: ${poolData.liquidity.toString()}`);
      console.log(`   Current Sqrt Price: ${poolData.sqrtPrice.toString()}`);
      
      // Get token info
      const tokenAInfo = await pool.getTokenAInfo();
      const tokenBInfo = await pool.getTokenBInfo();
      
      console.log(`\n   Token A:`);
      console.log(`      Mint: ${tokenAInfo.mint.toBase58()}`);
      console.log(`      Vault: ${poolData.tokenVaultA.toBase58()}`);
      
      console.log(`\n   Token B:`);
      console.log(`      Mint: ${tokenBInfo.mint.toBase58()}`);
      console.log(`      Vault: ${poolData.tokenVaultB.toBase58()}`);
      
      // Try to get mint metadata
      try {
        const mintA = await getMint(connection, tokenAInfo.mint);
        const mintB = await getMint(connection, tokenBInfo.mint);
        console.log(`\n   Token A Decimals: ${mintA.decimals}`);
        console.log(`   Token B Decimals: ${mintB.decimals}`);
      } catch (mintErr) {
        console.log(`   ⚠️  Could not fetch mint details`);
      }
      
      // Check if this is a USDC or SOL pool
      const isUSDC_A = tokenAInfo.mint.toBase58() === "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      const isUSDC_B = tokenBInfo.mint.toBase58() === "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
      const isSOL_A = tokenAInfo.mint.toBase58() === "So11111111111111111111111111111111111111112";
      const isSOL_B = tokenBInfo.mint.toBase58() === "So11111111111111111111111111111111111111112";
      
      if ((isUSDC_A || isUSDC_B) && (isSOL_A || isSOL_B)) {
        console.log(`\n   ✅ THIS IS A USDC-SOL POOL!`);
        console.log(`   💡 Use this address in your Rust program!`);
      }
      
      console.log("\n" + "─".repeat(80));
      
    } catch (err: any) {
      console.log(`   ❌ Error inspecting pool: ${err.message}`);
      console.log("─".repeat(80));
    }
  }
  
  console.log("\n✅ Inspection complete!");
  console.log("\n📝 Recommendations:");
  console.log("   • If USDC-SOL pool found: Use that address in your program");
  console.log("   • If not found: Use any pool for testing CPI structure");
  console.log("   • Alternative: Switch to Raydium/Meteora (more permissionless)");
  console.log("   • Or: Continue with stubs until mainnet deployment");
}

inspectPools().catch(console.error);
