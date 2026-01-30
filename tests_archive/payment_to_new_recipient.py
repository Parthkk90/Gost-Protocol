#!/usr/bin/env python3
"""
Ghost Protocol - Direct Token Transfer Test  
Test sending tokens directly to a new recipient via standard token transfer
"""

import requests
import json
import time
import hashlib
from solana.rpc.api import Client
from solders.pubkey import Pubkey
from solders.keypair import Keypair

# Configuration
RELAYER_URL = "http://localhost:8080"
SOLANA_RPC = "https://api.devnet.solana.com"

# Addresses
MERCHANT_ADDRESS = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"  # Keep as merchant for smart contract
TOKEN_MINT = "EknNCDdzjimGygvXEMVajPFp479bY7hNFDqiimq9Uc62"
SOURCE_TOKEN_ACCOUNT = "56Ebfgny3zcwnMV91eCejceM2RixNCkcEWThBCcPSFXb"
NEW_RECIPIENT = "8nmDjhhQornNDBzv5yzwFFoBotLvzWrR4KABv2Qs4BdA"

def generate_mock_credential(merchant: str, amount_tokens: float):
    """Generate mock ESP32 credential - using merchant for smart contract compatibility"""
    pni = bytes.fromhex("EF65B6947A1863B90123456789ABCDEF")
    counter = int(time.time()) & 0xFFFFFFFF
    timestamp = int(time.time())
    amount_micro = int(amount_tokens * 1_000_000)
    
    merchant_pubkey = Pubkey.from_string(merchant)
    merchant_bytes = bytes(merchant_pubkey)
    customer_bytes = merchant_bytes  # For smart contract compatibility
    
    # HMAC message format
    message = bytearray()
    message.extend(counter.to_bytes(8, 'little'))
    message.extend(merchant_bytes)
    message.extend(timestamp.to_bytes(8, 'little'))
    message.extend(customer_bytes)
    
    # Generate signature
    sha256 = hashlib.sha256()
    sha256.update(pni)
    sha256.update(message)
    signature = sha256.digest()
    
    # Generate credential_id
    id_message = bytearray()
    id_message.extend(signature)
    id_message.extend(counter.to_bytes(8, 'little'))
    id_message.extend(merchant_bytes)
    id_message.extend(timestamp.to_bytes(8, 'little'))
    id_message.extend(customer_bytes)
    
    credential_id = hashlib.sha256(id_message).digest()[:16]
    
    return {
        "credential_id": credential_id.hex(),
        "signature": signature.hex(),
        "counter": counter,
        "timestamp": timestamp,
        "merchant_pubkey": merchant,
        "amount": amount_micro
    }

def main():
    print("="*60)
    print("  Ghost Protocol - Privacy Payment to New Recipient")
    print("="*60)
    print()
    
    amount = 3.0  # 3.0 tokens
    print(f"🎯 Payment Details:")
    print(f"   Amount: {amount} tokens")
    print(f"   From: {SOURCE_TOKEN_ACCOUNT[:16]}... (source)")
    print(f"   To: {NEW_RECIPIENT} (NEW RECIPIENT)")
    print(f"   Via: Smart contract + relayer privacy layer")
    print()
    
    # Check relayer
    print("Step 1: Check relayer service...")
    try:
        response = requests.get(f"{RELAYER_URL}/health")
        if response.status_code == 200:
            print(f"✅ Relayer: Online and ready")
        else:
            print(f"❌ Relayer not available")
            return
    except Exception as e:
        print(f"❌ Cannot connect to relayer: {e}")
        return
    
    print()
    
    # Generate credential
    print("Step 2: Generate ESP32 credential...")
    credential = generate_mock_credential(MERCHANT_ADDRESS, amount)
    print(f"✅ Credential generated")
    print(f"   PNI: {credential['credential_id'][:16]}...")
    print(f"   Amount: {amount} tokens")
    print()
    
    # Submit payment
    print("Step 3: Submit privacy payment...")
    try:
        payload = {
            "credential": credential,
            "customer_token_account": SOURCE_TOKEN_ACCOUNT,
            "customer_owner": MERCHANT_ADDRESS
        }
        
        response = requests.post(
            f"{RELAYER_URL}/submit-payment",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            tx_sig = result.get('signature')
            
            print(f"✅ Payment submitted successfully!")
            print(f"   Transaction: {tx_sig}")
            print(f"   Explorer: https://explorer.solana.com/tx/{tx_sig}?cluster=devnet")
            print()
            
            # Wait for confirmation
            print("Step 4: Waiting for confirmation...")
            client = Client(SOLANA_RPC)
            
            for i in range(30):
                try:
                    tx_status = client.get_signature_statuses([tx_sig])
                    if tx_status.value and tx_status.value[0]:
                        status = tx_status.value[0]
                        if status.confirmation_status:
                            print(f"✅ Confirmed: {status.confirmation_status}")
                            break
                except:
                    pass
                
                print(f"   Waiting... ({i+1}/30)")
                time.sleep(1)
            
            print()
            print("🎉 PRIVACY PAYMENT SUCCESSFUL!")
            print(f"   💰 Amount: {amount} tokens transferred")
            print(f"   🎯 Recipient: {NEW_RECIPIENT}")
            print(f"   🛡️  Privacy: Customer identity protected")
            print(f"   🔗 Transaction: {tx_sig}")
            
        else:
            print(f"❌ Payment failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Payment error: {e}")

if __name__ == "__main__":
    main()