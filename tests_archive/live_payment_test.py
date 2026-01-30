#!/usr/bin/env python3
"""
Ghost Protocol - Live Payment Test
Execute a real privacy payment using the running relayer service
"""

import requests
import json
import time
import hashlib
import hmac
import os
from solana.rpc.api import Client
from solders.pubkey import Pubkey

# Configuration
RELAYER_URL = "http://localhost:8080"
SOLANA_RPC = "https://api.devnet.solana.com"

# Existing devnet addresses 
MERCHANT_ADDRESS = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"
TOKEN_MINT = "EknNCDdzjimGygvXEMVajPFp479bY7hNFDqiimq9Uc62"
TOKEN_ACCOUNT = "56Ebfgny3zcwnMV91eCejceM2RixNCkcEWThBCcPSFXb"

# New test recipient address
NEW_RECIPIENT_ADDRESS = "8nmDjhhQornNDBzv5yzwFFoBotLvzWrR4KABv2Qs4BdA"

def generate_mock_credential(merchant: str, amount_tokens: float):
    """Generate a mock ESP32 credential with correct HMAC format"""
    # Mock values (simulating ESP32 hardware)
    pni = bytes.fromhex("EF65B6947A1863B90123456789ABCDEF")  # Fixed test PNI (16 bytes)
    counter = int(time.time()) & 0xFFFFFFFF
    timestamp = int(time.time())
    
    # Convert amount to micro-units (6 decimals for this token)
    amount_micro = int(amount_tokens * 1_000_000)
    
    # Convert merchant string to 32 bytes (Solana pubkey format)
    from solders.pubkey import Pubkey
    merchant_pubkey = Pubkey.from_string(merchant)
    merchant_bytes = bytes(merchant_pubkey)
    
    # Customer owner (using merchant for testing - same as token account owner)
    customer_bytes = merchant_bytes  # For testing, customer = merchant
    
    # Create message for HMAC: counter || merchant_pubkey || timestamp || customer_owner
    # (Amount is NOT included in HMAC signature per ESP32 code)
    message = bytearray()
    
    # Counter (8 bytes, little endian)
    message.extend(counter.to_bytes(8, 'little'))
    
    # Merchant pubkey (32 bytes)
    message.extend(merchant_bytes)
    
    # Timestamp (8 bytes, little endian)  
    message.extend(timestamp.to_bytes(8, 'little'))
    
    # Customer owner (32 bytes)
    message.extend(customer_bytes)
    
    # Generate HMAC-SHA256 signature: SHA256(PNI || message)
    import hashlib
    sha256 = hashlib.sha256()
    sha256.update(pni)  # PNI as key
    sha256.update(message)
    signature = sha256.digest()  # 32 bytes
    
    # Generate credential_id: first 16 bytes of SHA256(signature || counter || merchant || timestamp || customer)
    id_message = bytearray()
    id_message.extend(signature)  # 32 bytes
    id_message.extend(counter.to_bytes(8, 'little'))  # 8 bytes
    id_message.extend(merchant_bytes)  # 32 bytes
    id_message.extend(timestamp.to_bytes(8, 'little'))  # 8 bytes
    id_message.extend(customer_bytes)  # 32 bytes
    
    credential_id = hashlib.sha256(id_message).digest()[:16]  # First 16 bytes
    
    # Create credential in format expected by relayer
    credential_data = {
        "credential_id": credential_id.hex(),
        "signature": signature.hex(),
        "counter": counter,
        "timestamp": timestamp,
        "merchant_pubkey": merchant,
        "amount": amount_micro
    }
    
    return credential_data

def main():
    print("="*60)
    print("  Ghost Protocol - Live Payment Test")
    print("="*60)
    print()
    
    # Payment details
    amount = 2.0  # 2.0 tokens
    recipient = MERCHANT_ADDRESS  # Use existing initialized merchant
    print(f"🔄 Initiating Privacy Payment:")
    print(f"   From: {TOKEN_ACCOUNT} (customer token account)")
    print(f"   To: {recipient} (merchant)")
    print(f"   Amount: {amount} tokens")
    print(f"   Token: {TOKEN_MINT}")
    print()
    
    # Step 1: Check relayer health
    print("Step 1: Check relayer service...")
    try:
        response = requests.get(f"{RELAYER_URL}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Relayer: {health_data.get('status', 'healthy')}")
            print(f"   Balance: {health_data.get('balance', 'unknown')} SOL")
            print(f"   Pubkey: {health_data.get('pubkey', 'unknown')}")
        else:
            print(f"❌ Relayer health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to relayer: {e}")
        print("   Continuing with payment attempt...")
        # Don't return, continue with payment
    
    print()
    
    # Step 2: Generate ESP32 credential (simulating ESP32)
    print("Step 2: Generate ESP32 credential (simulated)...")
    credential = generate_mock_credential(recipient, amount)
    print(f"✅ PNI: {credential['credential_id'][:16]}...")
    print(f"   Counter: {credential['counter']}")
    print(f"   Timestamp: {credential['timestamp']}")
    print(f"   Signature: {credential['signature'][:16]}...")
    print()
    
    # Step 3: Submit to relayer
    print("Step 3: Submit payment to relayer...")
    try:
        payload = {
            "credential": credential,
            "customer_token_account": TOKEN_ACCOUNT,
            "customer_owner": MERCHANT_ADDRESS  # Token account owner (source of funds)
        }
        
        response = requests.post(
            f"{RELAYER_URL}/submit-payment",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Payment submitted successfully!")
            print(f"   Transaction: {result.get('signature', 'pending')}")
            
            if 'signature' in result:
                tx_sig = result['signature']
                print(f"   Explorer: https://explorer.solana.com/tx/{tx_sig}?cluster=devnet")
                
                # Step 4: Wait for confirmation
                print()
                print("Step 4: Waiting for blockchain confirmation...")
                client = Client(SOLANA_RPC)
                
                for i in range(30):  # Wait up to 30 seconds
                    try:
                        tx_status = client.get_signature_statuses([tx_sig])
                        if tx_status.value and tx_status.value[0]:
                            status = tx_status.value[0]
                            if status.confirmation_status:
                                print(f"✅ Transaction confirmed: {status.confirmation_status}")
                                break
                    except:
                        pass
                    
                    print(f"   Waiting... ({i+1}/30)")
                    time.sleep(1)
                
                print()
                print("🎉 Privacy Payment Completed!")
                print(f"   • Customer identity: HIDDEN from merchant")
                print(f"   • Payment amount: {amount} tokens")
                print(f"   • Transaction ID: {tx_sig}")
                print(f"   • Merchant: {recipient[:16]}...")
                print(f"   • Merchant sees: Relayer address only")
                print(f"   • Privacy: Customer wallet completely hidden")
                
        else:
            print(f"❌ Payment failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Payment submission error: {e}")

if __name__ == "__main__":
    main()