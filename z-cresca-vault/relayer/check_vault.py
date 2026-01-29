#!/usr/bin/env python3
"""
Check vault account status on devnet
"""
import asyncio
import sys
from pathlib import Path
from solders.pubkey import Pubkey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
import struct

async def check_vault(vault_address: str):
    """Check if vault exists and show its data"""
    
    print(f"🔍 Checking vault: {vault_address}\n")
    
    try:
        vault_pubkey = Pubkey.from_string(vault_address)
    except Exception as e:
        print(f"❌ Invalid address format: {e}")
        return
    
    connection = AsyncClient("https://api.devnet.solana.com", commitment=Confirmed)
    
    # Fetch account
    account_info = await connection.get_account_info(vault_pubkey)
    
    if not account_info.value:
        print(f"❌ Vault account does not exist on-chain")
        print(f"\nTo create it:")
        print(f"1. cd /mnt/f/W3/gost_protocol/z-cresca-vault")
        print(f"2. anchor test --skip-deploy")
        await connection.close()
        return
    
    print(f"✅ Vault account found!")
    print(f"   Owner: {account_info.value.owner}")
    print(f"   Size: {len(account_info.value.data)} bytes")
    print(f"   Lamports: {account_info.value.lamports / 1e9:.9f} SOL\n")
    
    # Try to parse vault data
    data = account_info.value.data
    
    if len(data) < 100:
        print(f"⚠️  Account data too small, might not be initialized")
        await connection.close()
        return
    
    try:
        # Skip discriminator (8 bytes)
        offset = 8
        
        # owner: Pubkey (32 bytes)
        owner = Pubkey(data[offset:offset+32])
        offset += 32
        
        # vault_id: u64 (8 bytes)
        vault_id = struct.unpack('<Q', data[offset:offset+8])[0]
        offset += 8
        
        # collateral_token_mint: Pubkey (32 bytes)
        collateral_mint = Pubkey(data[offset:offset+32])
        offset += 32
        
        # collateral_amount: u64 (8 bytes)
        collateral_amount = struct.unpack('<Q', data[offset:offset+8])[0]
        offset += 8
        
        # credit_limit: u64 (8 bytes)
        credit_limit = struct.unpack('<Q', data[offset:offset+8])[0]
        offset += 8
        
        # outstanding_balance: u64 (8 bytes)
        outstanding_balance = struct.unpack('<Q', data[offset:offset+8])[0]
        offset += 8
        
        # yield_earned: u64 (8 bytes)
        yield_earned = struct.unpack('<Q', data[offset:offset+8])[0]
        
        print(f"📊 Vault Data:")
        print(f"   Owner: {owner}")
        print(f"   Vault ID: {vault_id}")
        print(f"   Collateral Mint: {collateral_mint}")
        print(f"   Collateral: {collateral_amount / 1e9:.4f} tokens")
        print(f"   Credit Limit: ${credit_limit / 1e6:.2f}")
        print(f"   Outstanding: ${outstanding_balance / 1e6:.2f}")
        print(f"   Yield Earned: ${yield_earned / 1e6:.2f}")
        
        available = credit_limit - outstanding_balance
        print(f"\n💳 Available Credit: ${available / 1e6:.2f}")
        
        if available > 0:
            print(f"\n✅ Vault is ready for payments!")
        else:
            print(f"\n⚠️  No available credit. Deposit collateral or pay down balance.")
        
    except Exception as e:
        print(f"⚠️  Could not parse vault data: {e}")
        print(f"   Raw data (first 100 bytes): {data[:100].hex()}")
    
    await connection.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 check_vault.py <VAULT_ADDRESS>")
        print("\nExample:")
        print("  python3 check_vault.py 8xYgbf3DUzs9mRCuVsVvNSb7vr6KMutAjCb7ys8jj57U")
        sys.exit(1)
    
    vault_address = sys.argv[1]
    asyncio.run(check_vault(vault_address))
