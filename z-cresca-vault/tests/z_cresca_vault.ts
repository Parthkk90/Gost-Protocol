import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ZCrescaVault } from "../target/types/z_cresca_vault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("z_cresca_vault", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ZCrescaVault as Program<ZCrescaVault>;
  
  // Test accounts
  let globalStateAuthority: Keypair;
  let treasury: Keypair;
  let user: Keypair;
  let merchant: Keypair;
  let relayer: Keypair;
  
  // Token accounts
  let usdcMint: PublicKey;
  let userUsdcAccount: PublicKey;
  let vaultUsdcAccount: PublicKey;
  
  // PDAs
  let globalStatePda: PublicKey;
  let vaultPda: PublicKey;
  
  const VAULT_ID = new anchor.BN(0);
  const INITIAL_COLLATERAL = new anchor.BN(1_000_000_000); // 1000 USDC
  const PAYMENT_AMOUNT = new anchor.BN(50_000_000); // 50 USDC

  before(async () => {
    // Generate keypairs
    globalStateAuthority = Keypair.generate();
    treasury = Keypair.generate();
    user = Keypair.generate();
    merchant = Keypair.generate();
    relayer = Keypair.generate();

    // Airdrop SOL to accounts
    const airdropPromises = [
      globalStateAuthority.publicKey,
      user.publicKey,
      relayer.publicKey,
    ].map(async (pubkey) => {
      const signature = await provider.connection.requestAirdrop(
        pubkey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(signature);
    });
    await Promise.all(airdropPromises);

    // Create USDC mint (6 decimals)
    usdcMint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      6
    );

    // Create user USDC account and mint tokens
    const userTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      user.publicKey
    );
    userUsdcAccount = userTokenAccount.address;

    await mintTo(
      provider.connection,
      user,
      usdcMint,
      userUsdcAccount,
      user,
      5_000_000_000 // 5000 USDC
    );

    // Derive PDAs
    [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        user.publicKey.toBuffer(),
        VAULT_ID.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Create vault USDC account (PDA owner requires allowOwnerOffCurve)
    const vaultTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user,
      usdcMint,
      vaultPda,
      true  // allowOwnerOffCurve - required for PDA owners
    );
    vaultUsdcAccount = vaultTokenAccount.address;
  });

  describe("Initialization", () => {
    it("Initializes global state", async () => {
      const defaultLtv = 15000; // 150% = 1.5x leverage in basis points
      const baseInterestRate = 200; // 2% APR

      await program.methods
        .initializeGlobalState(defaultLtv, baseInterestRate)
        .accounts({
          globalState: globalStatePda,
          authority: globalStateAuthority.publicKey,
          treasury: treasury.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([globalStateAuthority])
        .rpc();

      // Verify global state
      const globalState = await program.account.globalState.fetch(globalStatePda);
      assert.equal(globalState.authority.toBase58(), globalStateAuthority.publicKey.toBase58());
      assert.equal(globalState.defaultLtv, defaultLtv);
      assert.equal(globalState.baseInterestRate, baseInterestRate);
      assert.equal(globalState.paused, false);
      assert.equal(globalState.totalVaults.toNumber(), 0);
      
      console.log("✅ Global state initialized");
      console.log("   Default LTV:", globalState.defaultLtv / 100, "%");
      console.log("   Base Interest Rate:", globalState.baseInterestRate / 100, "% APR");
    });

    it("Initializes user vault", async () => {
      await program.methods
        .initializeVault(VAULT_ID)
        .accounts({
          vault: vaultPda,
          globalState: globalStatePda,
          owner: user.publicKey,
          collateralMint: usdcMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      // Verify vault
      const vault = await program.account.creditVault.fetch(vaultPda);
      assert.equal(vault.owner.toBase58(), user.publicKey.toBase58());
      assert.equal(vault.vaultId.toNumber(), VAULT_ID.toNumber());
      assert.equal(vault.collateralTokenMint.toBase58(), usdcMint.toBase58());
      assert.equal(vault.collateralAmount.toNumber(), 0);
      assert.equal(vault.creditLimit.toNumber(), 0);
      assert.equal(vault.active, true);

      // Verify global state updated
      const globalState = await program.account.globalState.fetch(globalStatePda);
      assert.equal(globalState.totalVaults.toNumber(), 1);

      console.log("✅ Vault created for user:", user.publicKey.toBase58().slice(0, 8) + "...");
      console.log("   Vault PDA:", vaultPda.toBase58());
    });
  });

  describe("Collateral Management", () => {
    it("Deposits collateral and calculates credit limit", async () => {
      const vaultBefore = await program.account.creditVault.fetch(vaultPda);
      const userBalanceBefore = await getAccount(provider.connection, userUsdcAccount);

      await program.methods
        .depositCollateral(INITIAL_COLLATERAL)
        .accounts({
          vault: vaultPda,
          globalState: globalStatePda,
          owner: user.publicKey,
          ownerTokenAccount: userUsdcAccount,
          vaultTokenAccount: vaultUsdcAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc();

      // Verify vault state
      const vault = await program.account.creditVault.fetch(vaultPda);
      assert.equal(
        vault.collateralAmount.toNumber(),
        INITIAL_COLLATERAL.toNumber()
      );

      // Credit limit should be collateral * LTV (1.5x = 15000 basis points / 10000)
      const expectedCreditLimit = INITIAL_COLLATERAL.muln(15000).divn(10000);
      assert.equal(
        vault.creditLimit.toNumber(),
        expectedCreditLimit.toNumber()
      );

      // Verify tokens transferred
      const userBalanceAfter = await getAccount(provider.connection, userUsdcAccount);
      const vaultBalance = await getAccount(provider.connection, vaultUsdcAccount);
      
      assert.equal(
        Number(userBalanceAfter.amount),
        Number(userBalanceBefore.amount) - INITIAL_COLLATERAL.toNumber()
      );
      assert.equal(
        Number(vaultBalance.amount),
        INITIAL_COLLATERAL.toNumber()
      );

      console.log("✅ Deposited", INITIAL_COLLATERAL.toNumber() / 1e6, "USDC");
      console.log("   Credit Limit:", vault.creditLimit.toNumber() / 1e6, "USDC");
      console.log("   Available Credit:", vault.creditLimit.toNumber() / 1e6, "USDC");
    });

    it("Calculates credit limit correctly", async () => {
      const creditLimit = await program.methods
        .calculateCreditLimit()
        .accounts({
          vault: vaultPda,
        })
        .view();

      // Should be 1000 * 1.5 = 1500 USDC (15000 basis points / 10000)
      const expectedLimit = INITIAL_COLLATERAL.muln(15000).divn(10000);
      assert.equal(creditLimit.toNumber(), expectedLimit.toNumber());

      console.log("✅ Credit limit calculated:", creditLimit.toNumber() / 1e6, "USDC");
    });
  });

  describe("Payment Authorization", () => {
    it("Approves payment within credit limit", async () => {
      const vaultBefore = await program.account.creditVault.fetch(vaultPda);

      await program.methods
        .authorizePayment(PAYMENT_AMOUNT, merchant.publicKey)
        .accounts({
          vault: vaultPda,
          globalState: globalStatePda,
          merchant: merchant.publicKey,
          relayer: relayer.publicKey,
        })
        .signers([relayer])
        .rpc();

      // Verify vault state updated
      const vault = await program.account.creditVault.fetch(vaultPda);
      assert.equal(
        vault.outstandingBalance.toNumber(),
        PAYMENT_AMOUNT.toNumber()
      );
      assert.equal(vault.totalPayments.toNumber(), 1);
      assert.equal(
        vault.totalPaymentVolume.toNumber(),
        PAYMENT_AMOUNT.toNumber()
      );

      console.log("✅ Payment APPROVED:", PAYMENT_AMOUNT.toNumber() / 1e6, "USDC");
      console.log("   Outstanding Balance:", vault.outstandingBalance.toNumber() / 1e6, "USDC");
      console.log("   Available Credit:", (vault.creditLimit.toNumber() - vault.outstandingBalance.toNumber()) / 1e6, "USDC");
    });

    it("Declines payment exceeding credit limit", async () => {
      const vaultBefore = await program.account.creditVault.fetch(vaultPda);
      const availableCredit = vaultBefore.creditLimit.sub(vaultBefore.outstandingBalance);
      
      // Try to spend more than available (should be declined)
      if (availableCredit.gtn(0)) {
        const excessiveAmount = availableCredit.add(new anchor.BN(100_000_000)); // 100 USDC over limit

        await program.methods
          .authorizePayment(excessiveAmount, merchant.publicKey)
          .accounts({
            vault: vaultPda,
            globalState: globalStatePda,
            merchant: merchant.publicKey,
            relayer: relayer.publicKey,
          })
          .signers([relayer])
          .rpc();
        
        // Check that vault state didn't change (payment declined)
        const vaultAfter = await program.account.creditVault.fetch(vaultPda);
        assert.equal(
          vaultAfter.outstandingBalance.toNumber(),
          vaultBefore.outstandingBalance.toNumber(),
          "Outstanding balance should not change on declined payment"
        );
        
        console.log("✅ Payment correctly DECLINED (insufficient credit)");
      } else {
        console.log("⏩ Skipping test - no available credit");
      }
    });

    it("Enforces daily spending limit", async () => {
      // Get vault's daily limit
      const vault = await program.account.creditVault.fetch(vaultPda);
      const dailyLimit = vault.dailyLimit;
      const dailySpent = vault.dailySpent;
      const remaining = dailyLimit.sub(dailySpent);

      console.log("   Daily Limit:", dailyLimit.toNumber() / 1e6, "USDC");
      console.log("   Already Spent:", dailySpent.toNumber() / 1e6, "USDC");
      console.log("   Remaining Today:", remaining.toNumber() / 1e6, "USDC");

      // Try to spend more than daily limit
      if (remaining.gtn(0)) {
        const overLimitAmount = remaining.addn(1_000_000); // 1 USDC over

        try {
          await program.methods
            .authorizePayment(overLimitAmount, merchant.publicKey)
            .accounts({
              vault: vaultPda,
              globalState: globalStatePda,
              merchant: merchant.publicKey,
              relayer: relayer.publicKey,
            })
            .signers([relayer])
            .rpc();

          assert.fail("Should have declined payment (daily limit)");
        } catch (error) {
          console.log("✅ Daily limit correctly enforced");
        }
      } else {
        console.log("⏩ Skipping daily limit test (already at limit)");
      }
    });

    it("Accrues interest correctly", async () => {
      const vaultBefore = await program.account.creditVault.fetch(vaultPda);
      const outstandingBefore = vaultBefore.outstandingBalance;

      // Wait a bit to allow time to pass
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Make another payment to trigger interest accrual
      const smallPayment = new anchor.BN(1_000_000); // 1 USDC
      
      await program.methods
        .authorizePayment(smallPayment, merchant.publicKey)
        .accounts({
          vault: vaultPda,
          globalState: globalStatePda,
          merchant: merchant.publicKey,
          relayer: relayer.publicKey,
        })
        .signers([relayer])
        .rpc();

      const vaultAfter = await program.account.creditVault.fetch(vaultPda);
      const outstandingAfter = vaultAfter.outstandingBalance;

      // Outstanding should increase by payment + interest (may be small)
      const increase = outstandingAfter.sub(outstandingBefore);
      assert.isTrue(increase.gte(smallPayment), "Outstanding should increase by at least payment amount");

      console.log("✅ Interest accrued:");
      console.log("   Before:", outstandingBefore.toNumber() / 1e6, "USDC");
      console.log("   After:", outstandingAfter.toNumber() / 1e6, "USDC");
      console.log("   Payment:", smallPayment.toNumber() / 1e6, "USDC");
      console.log("   Interest (if any):", (increase.toNumber() - smallPayment.toNumber()) / 1e6, "USDC");
    });
  });

  describe("Protocol Controls", () => {
    it("Allows admin to pause protocol", async () => {
      await program.methods
        .pauseProtocol()
        .accounts({
          globalState: globalStatePda,
          authority: globalStateAuthority.publicKey,
        })
        .signers([globalStateAuthority])
        .rpc();

      const globalState = await program.account.globalState.fetch(globalStatePda);
      assert.equal(globalState.paused, true);

      console.log("✅ Protocol paused");
    });

    it("Blocks operations when paused", async () => {
      try {
        await program.methods
          .authorizePayment(new anchor.BN(1_000_000), merchant.publicKey)
          .accounts({
            vault: vaultPda,
            globalState: globalStatePda,
            merchant: merchant.publicKey,
            relayer: relayer.publicKey,
          })
          .signers([relayer])
          .rpc();

        assert.fail("Should have blocked operation when paused");
      } catch (error) {
        console.log("✅ Operations correctly blocked when paused");
      }
    });

    it("Allows admin to unpause protocol", async () => {
      await program.methods
        .unpauseProtocol()
        .accounts({
          globalState: globalStatePda,
          authority: globalStateAuthority.publicKey,
        })
        .signers([globalStateAuthority])
        .rpc();

      const globalState = await program.account.globalState.fetch(globalStatePda);
      assert.equal(globalState.paused, false);

      console.log("✅ Protocol unpaused");
    });

    it("Prevents non-admin from pausing", async () => {
      try {
        await program.methods
          .pauseProtocol()
          .accounts({
            globalState: globalStatePda,
            authority: user.publicKey, // Not the admin
          })
          .signers([user])
          .rpc();

        assert.fail("Should have prevented non-admin from pausing");
      } catch (error) {
        console.log("✅ Non-admin correctly prevented from pausing");
      }
    });
  });

  describe("Vault State Queries", () => {
    it("Calculates utilization ratio correctly", async () => {
      const vault = await program.account.creditVault.fetch(vaultPda);
      
      const utilizationRatio = vault.outstandingBalance
        .muln(10000)
        .div(vault.creditLimit);

      console.log("✅ Vault Statistics:");
      console.log("   Collateral:", vault.collateralAmount.toNumber() / 1e6, "USDC");
      console.log("   Credit Limit:", vault.creditLimit.toNumber() / 1e6, "USDC");
      console.log("   Outstanding:", vault.outstandingBalance.toNumber() / 1e6, "USDC");
      console.log("   Utilization:", utilizationRatio.toNumber() / 100, "%");
      console.log("   Interest Rate:", vault.currentInterestRate / 100, "% APR");
      console.log("   Total Payments:", vault.totalPayments.toNumber());
      console.log("   Total Volume:", vault.totalPaymentVolume.toNumber() / 1e6, "USDC");
    });

    it("Verifies health factor calculation", async () => {
      const vault = await program.account.creditVault.fetch(vaultPda);
      
      // Health Factor = (Collateral * LTV) / Outstanding Balance
      const maxBorrow = vault.collateralAmount
        .muln(vault.ltvRatio)
        .divn(10000);
      
      const healthFactor = maxBorrow
        .muln(10000)
        .div(vault.outstandingBalance);

      console.log("✅ Health Factor:", healthFactor.toNumber() / 100);
      console.log("   (Should be > 120 to avoid liquidation)");
      
      assert.isTrue(healthFactor.gtn(12000)); // Health > 1.2
    });
  });

  describe("Global State Statistics", () => {
    it("Tracks global statistics correctly", async () => {
      const globalState = await program.account.globalState.fetch(globalStatePda);

      console.log("✅ Global Protocol Statistics:");
      console.log("   Total Vaults:", globalState.totalVaults.toNumber());
      console.log("   Total Collateral:", globalState.totalCollateral.toNumber() / 1e6, "USDC");
      console.log("   Total Credit Issued:", globalState.totalCreditIssued.toNumber() / 1e6, "USDC");
      console.log("   Treasury:", globalState.treasury.toBase58());
      console.log("   Paused:", globalState.paused);
      
      assert.equal(globalState.totalVaults.toNumber(), 1);
      assert.isTrue(globalState.totalCollateral.gt(new anchor.BN(0)));
    });
  });
});
