"""
Direct Relayer Test - Test real Solana transactions without ESP32
"""

import requests
import json
import time
import hashlib
import hmac
from solders.pubkey import Pubkey
from pathlib import Path

# Configuration
RELAYER_URL = "http://localhost:8080"
MERCHANT = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"
TOKEN_MINT = "EknNCDdzjimGygvXEMVajPFp479bY7hNFDqiimq9Uc62"
TOKEN_ACCOUNT = "56Ebfgny3zcwnMV91eCejceM2RixNCkcEWThBCcPSFXb"  # Your token account
CUSTOMER_OWNER = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"  # Your wallet
AMOUNT = 5.25

# Load wallet to get customer owner (if different)
wallet_path = Path("~/.config/solana/id.json").expanduser()
if wallet_path.exists():
    with open(wallet_path, 'r') as f:
        secret = json.load(f)
        # Just for display
        print(f"[Test] Using wallet from: {wallet_path}")

# Generate mock credential (similar to ESP32)
def generate_mock_credential():
    """Generate a mock credential for testing"""
    counter = int(time.time())
    timestamp = int(time.time())
    
    # Mock PNI (16 bytes)
    pni = b'\xEF\x65\xB6\x94\x7A\x18\x63\xB9\x01\x23\x45\x67\x89\xAB\xCD\xEF'
    
    # Calculate amount in micro-units (9 decimals)
    amount_micro = int(AMOUNT * 1_000_000)
    
    # Create credential data (same format as ESP32)
    credential_data = (
        pni +
        counter.to_bytes(8, 'little') +
        timestamp.to_bytes(8, 'little') +
        bytes.fromhex(MERCHANT.replace('1', '').replace('2', '').replace('3', '').replace('4', '').replace('5', '').replace('6', '').replace('7', '').replace('8', '').replace('9', '').replace('0', '').ljust(64, '0')[:64]) +
        amount_micro.to_bytes(8, 'little')
    )
    
    # Use a test secret key (in production this would be ESP32's secret)
    secret_key = b'test_secret_key_for_relayer_testing_only_32bytes!'[:32]
    
    # Generate HMAC-SHA256 signature
    signature = hmac.new(secret_key, credential_data, hashlib.sha256).digest()
    
    return {
        "credential_id": pni.hex(),
        "signature": signature.hex(),
        "counter": counter,
        "timestamp": timestamp,
        "merchant_pubkey": MERCHANT,
        "amount": amount_micro
    }

def test_relayer():
    print("\n" + "="*60)
    print("  Direct Relayer Test - Real Solana Transaction")
    print("="*60)
    print(f"\nMerchant: {MERCHANT}")
    print(f"Amount: {AMOUNT} tokens ({int(AMOUNT * 1_000_000)} micro-units)")
    print(f"Token Mint: {TOKEN_MINT}")
    print(f"Customer Token Account: {TOKEN_ACCOUNT}")
    print(f"Customer Owner: {CUSTOMER_OWNER}")
    
    # Check relayer health
    print("\n" + "-"*60)
    print("Step 1: Check relayer health")
    print("-"*60)
    try:
        resp = requests.get(f"{RELAYER_URL}/health", timeout=5)
        health = resp.json()
        print(f"✅ Relayer: {health['status']}")
        print(f"   Balance: {health['relayer_balance']} SOL")
        print(f"   Pubkey: {health['relayer_pubkey']}")
    except Exception as e:
        print(f"❌ Relayer not reachable: {e}")
        return
    
    # Generate mock credential
    print("\n" + "-"*60)
    print("Step 2: Generate mock credential")
    print("-"*60)
    credential = generate_mock_credential()
    print(f"✅ Generated credential")
    print(f"   Counter: {credential['counter']}")
    print(f"   ID: {credential['credential_id'][:16]}...")
    print(f"   Signature: {credential['signature'][:16]}...")
    
    # Submit to relayer
    print("\n" + "-"*60)
    print("Step 3: Submit payment to relayer")
    print("-"*60)
    payload = {
        "credential": credential,
        "customer_token_account": TOKEN_ACCOUNT,
        "customer_owner": CUSTOMER_OWNER
    }
    
    try:
        print("[Relayer] Submitting payment transaction...")
        resp = requests.post(
            f"{RELAYER_URL}/submit-payment",
            json=payload,
            timeout=60
        )
        
        if resp.status_code == 200:
            result = resp.json()
            print(f"\n✅ Payment transaction submitted!")
            print(f"\n{'='*60}")
            print(f"  TRANSACTION RESULT")
            print(f"{'='*60}")
            print(f"Success: {result.get('success')}")
            print(f"Signature: {result.get('signature')}")
            print(f"Merchant: {result.get('merchant')}")
            print(f"Amount: {result.get('amount')} micro-units")
            
            if 'explorer' in result:
                print(f"\n🔍 View on Solana Explorer:")
                print(f"   {result['explorer']}")
            
            print(f"\n{'='*60}\n")
            
        else:
            error = resp.json()
            print(f"❌ Payment failed: {error.get('error')}")
            
    except Exception as e:
        print(f"❌ Relayer request failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_relayer()
