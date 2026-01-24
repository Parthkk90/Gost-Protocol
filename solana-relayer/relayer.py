"""
Ghost Protocol - Solana Relayer Service
Bridges ESP32 hardware credentials to Solana blockchain

This service:
1. Receives payment credentials from ESP32
2. Constructs Solana transactions
3. Signs and submits to blockchain
4. Pays gas fees (gasless for customer)
"""

import asyncio
import aiohttp
from aiohttp import web
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.system_program import ID as SYS_PROGRAM_ID, create_account, CreateAccountParams
from solders.transaction import Transaction
from solders.instruction import Instruction, AccountMeta
from solders.message import Message
from solders.hash import Hash
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from solana.rpc.types import TxOpts
import base58
import struct
import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Configuration
ESP32_HOST = os.getenv("ESP32_HOST", "192.168.1.100")
SOLANA_RPC = os.getenv("SOLANA_RPC", "https://api.devnet.solana.com")
RELAYER_KEYPAIR_PATH = os.getenv("RELAYER_KEYPAIR", "./relayer-keypair.json")
PROGRAM_ID = Pubkey.from_string("7vMTXkMnG73kshMHLKft7T4fFEhCnNJF5ewEuD5Gbd2m")
TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

# Instruction discriminators (from IDL)
VERIFY_PAYMENT_CREDENTIAL_DISCRIMINATOR = bytes([123, 253, 103, 7, 85, 236, 196, 81])

# Load relayer keypair
def load_relayer_keypair():
    with open(RELAYER_KEYPAIR_PATH, 'r') as f:
        secret = json.load(f)
        return Keypair.from_bytes(bytes(secret))

relayer_keypair = load_relayer_keypair()
print(f"[Relayer] Loaded keypair: {relayer_keypair.pubkey()}")

# Solana client
client = AsyncClient(SOLANA_RPC)

# Statistics
stats = {
    "credentials_received": 0,
    "payments_submitted": 0,
    "payments_confirmed": 0,
    "payments_failed": 0,
    "total_fees_paid": 0
}

# ===================================================================
# SOLANA TRANSACTION CONSTRUCTION
# ===================================================================

def derive_merchant_pda(merchant_pubkey: Pubkey) -> tuple[Pubkey, int]:
    """Derive merchant PDA address"""
    seeds = [b"merchant", bytes(merchant_pubkey)]
    return Pubkey.find_program_address(seeds, PROGRAM_ID)

def derive_credential_pda(counter: int) -> tuple[Pubkey, int]:
    """Derive used credential PDA address"""
    counter_bytes = struct.pack("<Q", counter)
    seeds = [b"cred", counter_bytes]
    return Pubkey.find_program_address(seeds, PROGRAM_ID)

async def submit_payment(
    credential_id: bytes,
    signature: bytes,
    counter: int,
    timestamp: int,
    merchant_pubkey: str,
    amount: int,
    customer_token_account: str,
    customer_owner: str
):
    """
    Submit payment transaction to Solana
    
    Args:
        credential_id: 16-byte credential identifier
        signature: 32-byte HMAC signature
        counter: Transaction counter
        timestamp: Unix timestamp
        merchant_pubkey: Merchant's public key (base58)
        amount: Payment amount in token units
        customer_token_account: Customer's token account (base58)
        customer_owner: Customer's wallet owner (base58)
    """
    
    print(f"\n[Relayer] Processing payment...")
    print(f"[Relayer] Merchant: {merchant_pubkey}")
    print(f"[Relayer] Amount: {amount}")
    print(f"[Relayer] Counter: {counter}")
    
    try:
        # Convert public keys from hex (64 chars) or base58 (44 chars)
        if len(merchant_pubkey) == 64:
            # Hex format from ESP32
            merchant_pk = Pubkey(bytes.fromhex(merchant_pubkey))
            customer_owner_pk = Pubkey(bytes.fromhex(customer_owner))
        else:
            # Base58 format (legacy)
            merchant_pk = Pubkey.from_string(merchant_pubkey)
            customer_owner_pk = Pubkey.from_string(customer_owner)
        
        # Customer token account is always base58
        customer_token_pk = Pubkey.from_string(customer_token_account)
        
        # Derive PDAs
        merchant_pda, _ = derive_merchant_pda(merchant_pk)
        credential_pda, _ = derive_credential_pda(counter)
        
        print(f"[Relayer] Merchant PDA: {merchant_pda}")
        print(f"[Relayer] Credential PDA: {credential_pda}")
        
        # Fetch merchant account to get token account
        merchant_account_info = await client.get_account_info(merchant_pda, commitment=Confirmed)
        if not merchant_account_info.value:
            raise Exception("Merchant account not found - ensure merchant is initialized")
        
        # Parse merchant data to get payment_destination (token account)
        # Merchant account structure (from IDL):
        # - 8 bytes discriminator
        # - 32 bytes authority
        # - 32 bytes merchant_pubkey
        # - 4 bytes display_name length + string
        # - 32 bytes payment_destination
        # - 8 bytes total_payments
        # - 8 bytes total_volume
        # - 1 byte active
        merchant_data = merchant_account_info.value.data
        
        # Parse: skip discriminator (8) + authority (32) + merchant_pubkey (32) = 72 bytes
        # Then skip string (4 byte length + content)
        offset = 72
        display_name_len = struct.unpack("<I", bytes(merchant_data[offset:offset+4]))[0]
        offset += 4 + display_name_len
        
        # Now read payment_destination
        merchant_token_account = Pubkey.from_bytes(bytes(merchant_data[offset:offset+32]))
        print(f"[Relayer] Merchant token account: {merchant_token_account}")
        
        # Token delegate is the relayer itself
        token_delegate = relayer_keypair.pubkey()
        
        # Build instruction data
        # Format: discriminator + credential_id + signature + counter + timestamp + merchant_pubkey + amount + customer_owner
        instruction_data = (
            VERIFY_PAYMENT_CREDENTIAL_DISCRIMINATOR +
            credential_id +
            signature +
            struct.pack("<Q", counter) +
            struct.pack("<q", timestamp) +
            bytes(merchant_pk) +
            struct.pack("<Q", amount) +
            bytes(customer_owner_pk)
        )
        
        print(f"[Relayer] Instruction data length: {len(instruction_data)} bytes")
        
        # Build accounts list
        accounts = [
            AccountMeta(pubkey=merchant_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=credential_pda, is_signer=False, is_writable=True),
            AccountMeta(pubkey=relayer_keypair.pubkey(), is_signer=True, is_writable=True),
            AccountMeta(pubkey=customer_token_pk, is_signer=False, is_writable=True),
            AccountMeta(pubkey=merchant_token_account, is_signer=False, is_writable=True),
            AccountMeta(pubkey=token_delegate, is_signer=False, is_writable=False),
            AccountMeta(pubkey=TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
            AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
        ]
        
        # Create instruction
        instruction = Instruction(
            program_id=PROGRAM_ID,
            data=instruction_data,
            accounts=accounts
        )
        
        print(f"[Relayer] Building transaction...")
        
        # Get recent blockhash
        recent_blockhash_resp = await client.get_latest_blockhash(commitment=Confirmed)
        recent_blockhash = recent_blockhash_resp.value.blockhash
        
        # Build transaction
        message = Message.new_with_blockhash(
            [instruction],
            relayer_keypair.pubkey(),
            recent_blockhash
        )
        tx = Transaction([relayer_keypair], message, recent_blockhash)
        
        print(f"[Relayer] Sending transaction...")
        
        # Send transaction
        opts = TxOpts(skip_preflight=False, preflight_commitment=Confirmed)
        result = await client.send_transaction(tx, opts=opts)
        tx_sig = result.value
        
        print(f"[Relayer] ✅ Transaction sent: {tx_sig}")
        
        # Wait for confirmation
        print(f"[Relayer] Waiting for confirmation...")
        await client.confirm_transaction(tx_sig, commitment=Confirmed)
        print(f"[Relayer] ✅ Transaction confirmed!")
        
        stats["payments_submitted"] += 1
        stats["payments_confirmed"] += 1
        
        return {
            "success": True,
            "signature": str(tx_sig),
            "merchant": merchant_pubkey,
            "amount": amount,
            "explorer": f"https://explorer.solana.com/tx/{tx_sig}?cluster=devnet"
        }
        
    except Exception as e:
        print(f"[Relayer] ❌ Payment failed: {e}")
        import traceback
        traceback.print_exc()
        stats["payments_failed"] += 1
        raise

# ===================================================================
# HTTP API
# ===================================================================

async def handle_submit_payment(request):
    """POST /submit-payment"""
    try:
        data = await request.json()
        
        # Extract credential data
        cred = data.get("credential", {})
        customer_token_account = data.get("customer_token_account")
        customer_owner = data.get("customer_owner")
        
        if not cred or not customer_token_account or not customer_owner:
            return web.json_response(
                {"error": "Missing required fields"},
                status=400
            )
        
        # Parse credential
        credential_id = bytes.fromhex(cred["credential_id"])
        signature = bytes.fromhex(cred["signature"])
        counter = int(cred["counter"])
        timestamp = int(cred["timestamp"])
        merchant_pubkey = cred["merchant_pubkey"]
        amount = int(cred["amount"])
        
        stats["credentials_received"] += 1
        
        # Submit to Solana
        result = await submit_payment(
            credential_id,
            signature,
            counter,
            timestamp,
            merchant_pubkey,
            amount,
            customer_token_account,
            customer_owner
        )
        
        return web.json_response(result)
        
    except Exception as e:
        return web.json_response(
            {"error": str(e)},
            status=500
        )

async def handle_stats(request):
    """GET /stats"""
    return web.json_response(stats)

async def handle_health(request):
    """GET /health"""
    try:
        # Check relayer balance
        balance = await client.get_balance(relayer_keypair.pubkey())
        
        return web.json_response({
            "status": "healthy",
            "solana_connected": True,
            "relayer_balance": balance.value / 1e9,  # Convert lamports to SOL
            "relayer_pubkey": str(relayer_keypair.pubkey())
        })
    except Exception as e:
        print(f"[Health] Error: {e}")
        return web.json_response(
            {
                "status": "degraded", 
                "error": str(e),
                "relayer_pubkey": str(relayer_keypair.pubkey())
            },
            status=200  # Return 200 so client doesn't fail
        )

# ===================================================================
# ESP32 INTEGRATION
# ===================================================================

async def fetch_credential_from_esp32(merchant_pubkey: str, amount: int):
    """
    Fetch credential directly from ESP32
    This is for testing/demo - in production, client app would do this
    """
    url = f"http://{ESP32_HOST}/credential"
    params = {
        "merchant": merchant_pubkey,
        "amount": amount
    }
    
    print(f"[ESP32] Requesting credential from {url}")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as resp:
            if resp.status != 200:
                raise Exception(f"ESP32 returned {resp.status}")
            
            data = await resp.json()
            print(f"[ESP32] Received credential (counter={data['counter']})")
            return data

async def handle_request_from_esp32(request):
    """
    POST /request-from-esp32
    Demo endpoint that fetches credential from ESP32 and submits
    """
    try:
        data = await request.json()
        merchant_pubkey = data.get("merchant_pubkey")
        amount = data.get("amount")
        customer_token_account = data.get("customer_token_account")
        customer_owner = data.get("customer_owner")
        
        if not all([merchant_pubkey, amount, customer_token_account, customer_owner]):
            return web.json_response(
                {"error": "Missing required fields"},
                status=400
            )
        
        # Fetch credential from ESP32
        credential = await fetch_credential_from_esp32(merchant_pubkey, amount)
        
        # Submit to Solana
        result = await submit_payment(
            bytes.fromhex(credential["credential_id"]),
            bytes.fromhex(credential["signature"]),
            credential["counter"],
            credential["timestamp"],
            merchant_pubkey,
            amount,
            customer_token_account,
            customer_owner
        )
        
        return web.json_response(result)
        
    except Exception as e:
        return web.json_response(
            {"error": str(e)},
            status=500
        )

# ===================================================================
# SERVER
# ===================================================================

async def init_app():
    app = web.Application()
    
    # API routes
    app.router.add_post('/submit-payment', handle_submit_payment)
    app.router.add_post('/request-from-esp32', handle_request_from_esp32)
    app.router.add_get('/stats', handle_stats)
    app.router.add_get('/health', handle_health)
    
    return app

async def main():
    print("\n" + "="*60)
    print("  Ghost Protocol - Solana Relayer Service")
    print("="*60)
    print(f"\nRelayer Pubkey: {relayer_keypair.pubkey()}")
    print(f"Solana RPC: {SOLANA_RPC}")
    print(f"Program ID: {PROGRAM_ID}")
    print(f"ESP32 Host: {ESP32_HOST}")
    
    # Check balance
    balance = await client.get_balance(relayer_keypair.pubkey())
    print(f"Relayer Balance: {balance.value / 1e9:.4f} SOL")
    
    if balance.value < 0.01e9:  # Less than 0.01 SOL
        print("\n⚠️  WARNING: Low relayer balance!")
        print("Please fund the relayer wallet:")
        print(f"solana airdrop 1 {relayer_keypair.pubkey()} --url devnet")
    
    print("\nStarting HTTP server on port 8080...")
    print("API endpoints:")
    print("  POST /submit-payment")
    print("  POST /request-from-esp32")
    print("  GET  /stats")
    print("  GET  /health")
    print("\n" + "="*60 + "\n")
    
    app = await init_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()
    
    print("✅ Relayer service ready!\n")
    
    # Keep running
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        print("\n\n[Relayer] Shutting down...")
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
