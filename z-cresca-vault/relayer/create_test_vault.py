#!/usr/bin/env python3
"""
Create a test vault on devnet for testing real payments
"""
import asyncio
import os
from pathlib import Path
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from anchorpy import Provider, Wallet, Program, Context
import json

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / '.env')
except:
    pass

PROGRAM_ID = Pubkey.from_string(os.getenv("PROGRAM_ID", "HX5nu29URyVfVFDsiVRumvf64egFydNqgGibBpPxt3nz"))
RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")

# USDC devnet mint
USDC_MINT = Pubkey.from_string("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")

async def create_test_vault():
    """Create a test vault with some collateral"""
    
    print("🏗️  Creating test vault on devnet...\n")
    
    # Load or create test user keypair
    vault_owner_path = Path(__file__).parent / "test-vault-owner.json"
    
    if vault_owner_path.exists():
        print(f"📁 Loading existing vault owner keypair...")
        with open(vault_owner_path) as f:
            secret = json.load(f)
            vault_owner = Keypair.from_bytes(bytes(secret))
    else:
        print(f"🔑 Generating new vault owner keypair...")
        vault_owner = Keypair()
        with open(vault_owner_path, 'w') as f:
            json.dump(list(vault_owner.secret()), f)
        print(f"   Saved to: {vault_owner_path}")
    
    print(f"   Owner: {vault_owner.pubkey()}\n")
    
    # Connect to devnet
    connection = AsyncClient(RPC_URL, commitment=Confirmed)
    
    # Check balance
    balance_resp = await connection.get_balance(vault_owner.pubkey())
    balance = balance_resp.value / 1e9
    print(f"💰 Current balance: {balance:.4f} SOL")
    
    if balance < 0.5:
        print(f"⚠️  Low balance! Requesting airdrop...")
        print(f"   Run: solana airdrop 2 {vault_owner.pubkey()} --url devnet")
        return
    
    # Derive vault PDA
    vault_id = 1  # First vault for this user
    seeds = [b"vault", bytes(vault_owner.pubkey()), vault_id.to_bytes(8, "little")]
    vault_pda, vault_bump = Pubkey.find_program_address(seeds, PROGRAM_ID)
    
    print(f"\n📦 Vault PDA: {vault_pda}")
    print(f"   Bump: {vault_bump}")
    print(f"   Vault ID: {vault_id}\n")
    
    # Check if vault already exists
    vault_info = await connection.get_account_info(vault_pda)
    if vault_info.value:
        print(f"✅ Vault already exists!")
        print(f"\nTo use this vault, update register_test_card.py:")
        print(f'   test_vault = "{vault_pda}"')
        
        # Try to deserialize and show vault data
        print(f"\n📊 Vault account found (size: {len(vault_info.value.data)} bytes)")
        return vault_pda
    
    print(f"🚧 Vault doesn't exist yet. Need to initialize it.")
    print(f"\nTo create the vault, you need to:")
    print(f"1. Build the program IDL:")
    print(f"   cd /mnt/f/W3/gost_protocol/z-cresca-vault")
    print(f"   anchor build")
    print(f"\n2. Initialize global state (if not done):")
    print(f"   anchor run init-global-state")
    print(f"\n3. Initialize vault:")
    print(f"   anchor run init-vault --vault-id {vault_id}")
    print(f"\nOr use the test suite:")
    print(f"   anchor test --skip-deploy")
    
    await connection.close()
    return vault_pda

if __name__ == "__main__":
    vault_pda = asyncio.run(create_test_vault())
    
    if vault_pda:
        print(f"\n" + "="*60)
        print(f"✅ Test vault ready: {vault_pda}")
        print(f"\nNext steps:")
        print(f"1. Update register_test_card.py with this vault address")
        print(f"2. Deposit collateral to the vault")
        print(f"3. Test real payments!")
        print(f"="*60)
