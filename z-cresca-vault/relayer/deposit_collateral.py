#!/usr/bin/env python3
"""
Deposit Collateral Script
Deposits SOL into an existing vault to enable credit line
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import ID as SYS_PROGRAM_ID
from spl.token.constants import TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
from spl.token.instructions import (
    get_associated_token_address,
    create_associated_token_account,
    sync_native,
    close_account,
    CloseAccountParams,
    SyncNativeParams
)
from solders.system_program import transfer, TransferParams
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
    """Calculate Anchor instruction discriminator"""
    return hashlib.sha256(f"global:{ix_name}".encode()).digest()[:8]

class CollateralDepositor:
    """Deposit collateral into vault"""
    
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
    
    async def deposit_collateral(self, vault_id: int, amount_sol: float):
        """
        Deposit SOL collateral into vault (via wrapped SOL)
        
        Args:
            vault_id: Vault ID to deposit into
            amount_sol: Amount of SOL to deposit
        """
        print(f"\n💰 Depositing {amount_sol} SOL as collateral...")
        
        # Get PDAs
        global_state, _ = await self.get_global_state_pda()
        vault, _ = await self.get_vault_pda(self.user.pubkey(), vault_id)
        
        print(f"   Vault: {vault}")
        print(f"   Global State: {global_state}")
        
        # Verify vault exists
        vault_info = await self.connection.get_account_info(vault)
        if not vault_info.value:
            print(f"\n❌ Error: Vault not found!")
            print(f"   Create vault first: python initialize_real_vault.py")
            return False
        
        print(f"   ✅ Vault exists (size: {len(vault_info.value.data)} bytes)")
        
        # Convert SOL to lamports
        amount_lamports = int(amount_sol * 1_000_000_000)
        print(f"   Amount: {amount_lamports} lamports")
        
        # Wrapped SOL mint (native SOL on Solana)
        WSOL_MINT = Pubkey.from_string("So11111111111111111111111111111111111111112")
        
        # Get associated token accounts
        owner_ata = get_associated_token_address(self.user.pubkey(), WSOL_MINT)
        vault_ata = get_associated_token_address(vault, WSOL_MINT)
        
        print(f"   Owner ATA: {owner_ata}")
        print(f"   Vault ATA: {vault_ata}")
        
        instructions = []
        
        # 1. Create owner's ATA if it doesn't exist
        owner_ata_info = await self.connection.get_account_info(owner_ata)
        if not owner_ata_info.value:
            print(f"   📝 Creating owner's wrapped SOL account...")
            instructions.append(
                create_associated_token_account(
                    payer=self.user.pubkey(),
                    owner=self.user.pubkey(),
                    mint=WSOL_MINT
                )
            )
        
        # 2. Transfer SOL to owner's ATA (to wrap it)
        print(f"   💸 Wrapping {amount_sol} SOL...")
        instructions.append(
            transfer(
                TransferParams(
                    from_pubkey=self.user.pubkey(),
                    to_pubkey=owner_ata,
                    lamports=amount_lamports
                )
            )
        )
        
        # 3. Sync native (tells token program this is wrapped SOL)
        instructions.append(sync_native(SyncNativeParams(program_id=TOKEN_PROGRAM_ID, account=owner_ata)))
        
        # 4. Create vault's ATA if it doesn't exist
        vault_ata_info = await self.connection.get_account_info(vault_ata)
        if not vault_ata_info.value:
            print(f"   📝 Creating vault's token account...")
            instructions.append(
                create_associated_token_account(
                    payer=self.user.pubkey(),
                    owner=vault,
                    mint=WSOL_MINT
                )
            )
        
        # 5. Deposit collateral instruction
        discriminator = get_discriminator("deposit_collateral")
        print(f"   Discriminator: {discriminator.hex()}")
        
        args = struct.pack('<Q', amount_lamports)
        data = discriminator + args
        
        # Accounts: vault, global_state, owner, owner_token_account, vault_token_account, token_program
        accounts = [
            AccountMeta(pubkey=vault, is_signer=False, is_writable=True),
            AccountMeta(pubkey=global_state, is_signer=False, is_writable=True),
            AccountMeta(pubkey=self.user.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=owner_ata, is_signer=False, is_writable=True),
            AccountMeta(pubkey=vault_ata, is_signer=False, is_writable=True),
            AccountMeta(pubkey=Pubkey.from_string(str(TOKEN_PROGRAM_ID)), is_signer=False, is_writable=False),
        ]
        
        instructions.append(Instruction(PROGRAM_ID, data, accounts))
        
        # 6. Close owner's ATA to get SOL back (cleanup)
        instructions.append(
            close_account(
                CloseAccountParams(
                    program_id=TOKEN_PROGRAM_ID,
                    account=owner_ata,
                    dest=self.user.pubkey(),
                    owner=self.user.pubkey()
                )
            )
        )
        
        try:
            recent_blockhash = (await self.connection.get_latest_blockhash()).value.blockhash
            tx = Transaction.new_with_payer(instructions, self.user.pubkey())
            tx.sign([self.user], recent_blockhash)
            
            print(f"\n   📤 Sending transaction ({len(instructions)} instructions)...")
            sig = await self.connection.send_transaction(
                tx,
                opts=TxOpts(skip_preflight=False, preflight_commitment=Confirmed)
            )
            
            print(f"   ⏳ Confirming transaction...")
            await self.connection.confirm_transaction(sig.value, commitment=Confirmed)
            
            print(f"\n   ✅ Collateral deposited successfully!")
            print(f"   Transaction: {sig.value}")
            
            # Wait and verify deposit
            print(f"\n   🔍 Verifying deposit...")
            await asyncio.sleep(2)
            
            vault_info = await self.connection.get_account_info(vault)
            if vault_info.value:
                print(f"   ✅ Vault updated!")
                print(f"   Size: {len(vault_info.value.data)} bytes")
            
            # Calculate estimated credit line (1.5x collateral at $150/SOL)
            sol_price_usd = 150.0
            collateral_value_usd = amount_sol * sol_price_usd
            credit_limit_usd = collateral_value_usd * 1.5
            
            print(f"\n   💳 Estimated Credit Line:")
            print(f"   Collateral: {amount_sol} SOL (${collateral_value_usd:.2f})")
            print(f"   Credit Available: ${credit_limit_usd:.2f}")
            
            return True
            
        except Exception as e:
            print(f"\n   ❌ Deposit failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def check_balance(self):
        """Check user's SOL balance"""
        balance = await self.connection.get_balance(self.user.pubkey())
        return balance.value / 1e9
    
    async def close(self):
        """Close connection"""
        await self.connection.close()

async def main():
    """Deposit collateral into vault"""
    print("=" * 60)
    print("💰 Z-Cresca Collateral Deposit")
    print("=" * 60)
    
    # Parse arguments
    if len(sys.argv) < 2:
        print("\n❌ Usage: python deposit_collateral.py <amount_sol> [vault_id]")
        print("\nExamples:")
        print("  python deposit_collateral.py 0.5        # Deposit 0.5 SOL to vault 1")
        print("  python deposit_collateral.py 1.0 2      # Deposit 1.0 SOL to vault 2")
        return
    
    try:
        amount_sol = float(sys.argv[1])
    except ValueError:
        print(f"\n❌ Error: Invalid amount '{sys.argv[1]}'")
        print("   Amount must be a number (e.g., 0.5)")
        return
    
    vault_id = 1  # Default vault
    if len(sys.argv) > 2:
        try:
            vault_id = int(sys.argv[2])
        except ValueError:
            print(f"\n❌ Error: Invalid vault_id '{sys.argv[2]}'")
            return
    
    print(f"\nDeposit Amount: {amount_sol} SOL")
    print(f"Target Vault ID: {vault_id}")
    
    # Load user keypair
    secret_key = os.getenv("USER_SECRET_KEY") or os.getenv("RELAYER_SECRET_KEY")
    if not secret_key:
        print("\n❌ Error: USER_SECRET_KEY not set in .env")
        print("\nSet it to your wallet's base58 secret key:")
        print("  USER_SECRET_KEY=<your_base58_secret>")
        return
    
    user_keypair = Keypair.from_base58_string(secret_key)
    print(f"\n👤 User: {user_keypair.pubkey()}")
    
    # Initialize
    depositor = CollateralDepositor(user_keypair, RPC_URL)
    
    # Check balance
    balance = await depositor.check_balance()
    print(f"   Balance: {balance:.4f} SOL")
    
    if balance < amount_sol + 0.01:  # Need extra for fees
        print(f"\n❌ Insufficient balance!")
        print(f"   Need: {amount_sol + 0.01:.4f} SOL")
        print(f"   Have: {balance:.4f} SOL")
        print(f"\n   Get devnet SOL:")
        print(f"   solana airdrop 2 {user_keypair.pubkey()} --url devnet")
        await depositor.close()
        return
    
    # Deposit collateral
    success = await depositor.deposit_collateral(vault_id, amount_sol)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ COLLATERAL DEPOSITED SUCCESSFULLY")
        print("=" * 60)
        print(f"\nYour vault now has {amount_sol} SOL collateral!")
        print(f"\nNext steps:")
        print(f"1. Test payments with real vault:")
        print(f"   python payment_relayer.py")
        print(f"\n2. Register your NFC card:")
        print(f"   python register_test_card.py")
        print(f"\n3. Make a payment:")
        print(f"   python merchant_terminal_simulator.py")
        print("=" * 60)
    
    await depositor.close()

if __name__ == "__main__":
    asyncio.run(main())
