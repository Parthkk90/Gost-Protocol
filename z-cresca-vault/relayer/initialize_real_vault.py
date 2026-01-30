#!/usr/bin/env python3
"""
Real Vault Initialization Script
Creates actual on-chain vault with SOL collateral
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import ID as SYS_PROGRAM_ID
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
from solders.transaction import Transaction
from solders.instruction import Instruction, AccountMeta
import struct
import hashlib

# Load environment
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

PROGRAM_ID = Pubkey.from_string(os.getenv("PROGRAM_ID", "HX5nu29URyVfVFDsiVRumvf64egFydNqgGibBpPxt3nz"))
RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")

def get_discriminator(ix_name: str) -> bytes:
    """
    Calculate Anchor instruction discriminator
    Anchor uses: sha256("global:<instruction_name>")[:8]
    """
    return hashlib.sha256(f"global:{ix_name}".encode()).digest()[:8]

class VaultInitializer:
    """Initialize real vault on-chain"""
    
    def __init__(self, user_keypair: Keypair, rpc_url: str):
        self.user = user_keypair
        self.connection = AsyncClient(rpc_url, commitment=Confirmed)
        
    async def get_global_state_pda(self) -> tuple[Pubkey, int]:
        """Get global state PDA"""
        seeds = [b"global_state"]
        return Pubkey.find_program_address(seeds, PROGRAM_ID)
    
    async def get_vault_pda(self, owner: Pubkey, vault_id: int) -> tuple[Pubkey, int]:
        """Get vault PDA"""
        seeds = [
            b"vault",
            bytes(owner),
            vault_id.to_bytes(8, "little")
        ]
        return Pubkey.find_program_address(seeds, PROGRAM_ID)
    
    async def initialize_global_state(self):
        """Initialize global state (one-time, may already exist)"""
        print("\n🌐 Initializing global state...")
        
        global_state, bump = await self.get_global_state_pda()
        print(f"   Global state PDA: {global_state}")
        
        # Check if already initialized
        try:
            account_info = await self.connection.get_account_info(global_state)
            if account_info.value:
                print(f"   ✅ Global state already initialized")
                print(f"   Size: {len(account_info.value.data)} bytes")
                return global_state
        except Exception as e:
            print(f"   ℹ️  Account check: {e}")
        
        print(f"   📝 Global state not found, initializing...")
        
        # Calculate discriminator using Anchor method
        discriminator = get_discriminator("initialize_global_state")
        print(f"   Discriminator: {discriminator.hex()}")
        
        # Args: default_ltv (u16), base_interest_rate (u16)
        # Both are in BASIS POINTS (10000 = 100%)
        # Program constants:
        #   MIN_LTV = 10_000 (100%), MAX_LTV = 20_000 (200%)
        #   MAX_INTEREST_RATE = 2_000 (20%)
        default_ltv = 15_000  # 150% LTV in basis points (allows 1.5x leverage)
        base_interest_rate = 500  # 5% APR in basis points
        args = struct.pack('<HH', default_ltv, base_interest_rate)
        data = discriminator + args
        
        print(f"   Default LTV: {default_ltv/100}% (basis points: {default_ltv})")
        print(f"   Base APR: {base_interest_rate/100}% (basis points: {base_interest_rate})")
        
        # Treasury account (can be any pubkey, using user for simplicity)
        treasury = self.user.pubkey()
        
        accounts = [
            AccountMeta(pubkey=global_state, is_signer=False, is_writable=True),
            AccountMeta(pubkey=self.user.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=treasury, is_signer=False, is_writable=False),
            AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
        ]
        
        ix = Instruction(PROGRAM_ID, data, accounts)
        
        # Send transaction
        try:
            recent_blockhash = (await self.connection.get_latest_blockhash()).value.blockhash
            tx = Transaction.new_with_payer([ix], self.user.pubkey())
            tx.sign([self.user], recent_blockhash)
            
            print(f"   📤 Sending transaction...")
            sig = await self.connection.send_transaction(
                tx,
                opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed)
            )
            
            print(f"   ⏳ Confirming transaction...")
            await self.connection.confirm_transaction(sig.value, commitment=Confirmed)
            
            print(f"\n   ✅ Global state initialized successfully!")
            print(f"   Transaction: {sig.value}")
            print(f"   Global State: {global_state}")
            
            # Verify initialization
            print(f"\n   🔍 Verifying global state...")
            await asyncio.sleep(2)  # Wait for finalization
            account_info = await self.connection.get_account_info(global_state)
            if account_info.value:
                print(f"   ✅ Global state account exists!")
                print(f"   Size: {len(account_info.value.data)} bytes")
            else:
                print(f"   ⚠️  Warning: Account not found after initialization")
            
            return global_state
            
        except Exception as e:
            print(f"   ❌ Global state init failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Check if it exists now anyway
            try:
                account_info = await self.connection.get_account_info(global_state)
                if account_info.value:
                    print(f"   ✅ Global state exists despite error")
                    return global_state
            except:
                pass
            
            raise
    
    async def create_vault(
        self,
        vault_id: int,
        collateral_sol: float = 0.5,
        credit_multiplier: float = 1.5
    ):
        """Create vault with SOL collateral
        
        Args:
            vault_id: Unique vault ID for this user
            collateral_sol: SOL amount to deposit (note: actual deposit happens separately)
            credit_multiplier: Credit line = collateral * multiplier (for display only)
        """
        print(f"\n💰 Creating vault...")
        
        # Calculate credit info for display
        sol_price_usd = 150.0
        collateral_value_usd = collateral_sol * sol_price_usd
        credit_limit_usd = collateral_value_usd * credit_multiplier
        
        print(f"   Vault ID: {vault_id}")
        print(f"   Estimated Collateral Value: ${collateral_value_usd:.2f}")
        print(f"   Estimated Credit Limit: ${credit_limit_usd:.2f} ({credit_multiplier}x)")
        
        # Get PDAs
        global_state, _ = await self.get_global_state_pda()
        vault, vault_bump = await self.get_vault_pda(self.user.pubkey(), vault_id)
        
        print(f"   Vault PDA: {vault}")
        
        # Check if vault already exists
        try:
            vault_info = await self.connection.get_account_info(vault)
            if vault_info.value:
                print(f"   ✅ Vault already exists!")
                return vault
        except Exception as e:
            print(f"   ℹ️  Vault check: {e}")
        
        # Calculate discriminator using Anchor method
        discriminator = get_discriminator("initialize_vault")
        print(f"   Discriminator: {discriminator.hex()}")
        
        # Args: vault_id (u64)
        args = struct.pack('<Q', vault_id)
        data = discriminator + args
        
        # Collateral mint (SOL is native, use wrapped SOL mint)
        SOL_MINT = Pubkey.from_string("So11111111111111111111111111111111111111112")
        TOKEN_PROGRAM = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        
        accounts = [
            AccountMeta(pubkey=vault, is_signer=False, is_writable=True),
            AccountMeta(pubkey=global_state, is_signer=False, is_writable=True),
            AccountMeta(pubkey=self.user.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=SOL_MINT, is_signer=False, is_writable=False),
            AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(pubkey=TOKEN_PROGRAM, is_signer=False, is_writable=False),
        ]
        
        ix = Instruction(PROGRAM_ID, data, accounts)
        
        try:
            recent_blockhash = (await self.connection.get_latest_blockhash()).value.blockhash
            tx = Transaction.new_with_payer([ix], self.user.pubkey())
            tx.sign([self.user], recent_blockhash)
            
            print(f"   📤 Sending transaction...")
            sig = await self.connection.send_transaction(
                tx,
                opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed)
            )
            
            print(f"   ⏳ Confirming transaction...")
            await self.connection.confirm_transaction(sig.value, commitment=Confirmed)
            
            print(f"\n   ✅ Vault created successfully!")
            print(f"   Transaction: {sig.value}")
            print(f"   Vault Address: {vault}")
            
            # Verify vault creation
            print(f"\n   🔍 Verifying vault...")
            await asyncio.sleep(2)
            vault_info = await self.connection.get_account_info(vault)
            if vault_info.value:
                print(f"   ✅ Vault account exists!")
                print(f"   Size: {len(vault_info.value.data)} bytes")
            else:
                print(f"   ⚠️  Warning: Vault not found after creation")
            
            return vault
            
        except Exception as e:
            print(f"   ❌ Vault creation failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def check_balance(self):
        """Check user's SOL balance"""
        balance = await self.connection.get_balance(self.user.pubkey())
        return balance.value / 1e9
    
    async def close(self):
        """Close connection"""
        await self.connection.close()

async def main():
    """Create real vault with collateral"""
    print("=" * 60)
    print("🏦 Z-Cresca Real Vault Initialization")
    print("=" * 60)
    
    # Debug: Print discriminators to verify they're correct
    print("\n🔍 Instruction Discriminators:")
    init_global = get_discriminator("initialize_global_state")
    init_vault = get_discriminator("initialize_vault")
    print(f"   initialize_global_state: {init_global.hex()}")
    print(f"   initialize_vault: {init_vault.hex()}")
    
    # Load user keypair
    secret_key = os.getenv("USER_SECRET_KEY") or os.getenv("RELAYER_SECRET_KEY")
    if not secret_key:
        print("\n❌ Error: USER_SECRET_KEY not set in .env")
        print("\nSet it to your wallet's base58 secret key:")
        print("  USER_SECRET_KEY=<your_base58_secret>")
        print("\nOr generate new wallet:")
        print("  solana-keygen new --no-bip39-passphrase")
        return
    
    user_keypair = Keypair.from_base58_string(secret_key)
    print(f"\n👤 User: {user_keypair.pubkey()}")
    
    # Initialize
    initializer = VaultInitializer(user_keypair, RPC_URL)
    
    # Check balance
    balance = await initializer.check_balance()
    print(f"   Balance: {balance:.4f} SOL")
    
    if balance < 0.1:
        print(f"\n❌ Insufficient balance!")
        print(f"   Need at least 0.1 SOL for collateral + fees")
        print(f"\n   Get devnet SOL:")
        print(f"   solana airdrop 2 {user_keypair.pubkey()} --url devnet")
        await initializer.close()
        return
    
    # Step 1: Initialize global state (one-time)
    try:
        global_state = await initializer.initialize_global_state()
        
        # Verify global_state is actually initialized before proceeding
        print(f"\n🔍 Final verification of global state before vault creation...")
        account_info = await initializer.connection.get_account_info(global_state)
        if not account_info.value:
            print(f"❌ CRITICAL: Global state account does not exist!")
            print(f"   Address: {global_state}")
            print(f"\n   This means initialize_global_state failed silently.")
            print(f"   Check Solana Explorer: https://explorer.solana.com/address/{global_state}?cluster=devnet")
            await initializer.close()
            return
        
        print(f"✅ Global state confirmed ready!")
        print(f"   Size: {len(account_info.value.data)} bytes")
        print(f"   Owner: {account_info.value.owner}")
        
    except Exception as e:
        print(f"\n❌ Failed to initialize global state: {e}")
        await initializer.close()
        return
    
    # Step 2: Create vault
    vault_id = 1  # User's first vault
    
    vault_address = await initializer.create_vault(
        vault_id=vault_id,
    )
    
    if vault_address:
        print("\n" + "=" * 60)
        print("✅ VAULT CREATED SUCCESSFULLY")
        print("=" * 60)
        print(f"\nVault Address: {vault_address}")
        print(f"Vault ID: {vault_id}")
        print(f"\nNext steps:")
        print(f"1. Deposit collateral (separate instruction - to be implemented)")
        print(f"   Future: python3 deposit_collateral.py {vault_address} <amount>")
        print(f"\n2. For now, update register_test_card.py with this vault address:")
        print(f"   test_vault = \"{vault_address}\"")
        print(f"\n3. Register your card:")
        print(f"   python3 register_test_card.py")
        print(f"\n4. Make payments (will use mock vault data until collateral deposited):")
        print(f"   python3 merchant_terminal_simulator.py")
        print("=" * 60)
    
    await initializer.close()

if __name__ == "__main__":
    asyncio.run(main())