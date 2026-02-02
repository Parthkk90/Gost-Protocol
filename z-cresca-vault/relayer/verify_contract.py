"""
Quick verification that the smart contract is deployed and accessible
"""
import asyncio
from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
import os
from dotenv import load_dotenv

load_dotenv()

async def verify_program():
    # Check both networks
    networks = [
        ("mainnet", os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")),
        ("devnet", "https://api.devnet.solana.com"),
    ]
    
    program_id = os.getenv("PROGRAM_ID", "HX5nu29URyVfVFDsiVRumvf64egFydNqgGibBpPxt3nz")
    
    print(f"🔍 Verifying program deployment on multiple networks...")
    print(f"   Program ID: {program_id}")
    print()
    
    for network_name, rpc_url in networks:
        print(f"📡 Checking {network_name}: {rpc_url}")
        client = AsyncClient(rpc_url)
        
        try:
            program_pubkey = Pubkey.from_string(program_id)
            account_info = await client.get_account_info(program_pubkey)
            
            if account_info.value:
                print(f"   ✅ Program found on {network_name}!")
                print(f"      Owner: {account_info.value.owner}")
                print(f"      Executable: {account_info.value.executable}")
                print(f"      Data length: {len(account_info.value.data)} bytes")
            else:
                print(f"   ❌ Program not found on {network_name}")
                
        except Exception as e:
            print(f"   ❌ Error checking {network_name}: {e}")
        finally:
            await client.close()
        print()

if __name__ == "__main__":
    asyncio.run(verify_program())
