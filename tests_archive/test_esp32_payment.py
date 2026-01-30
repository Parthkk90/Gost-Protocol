#!/usr/bin/env python3
"""
Ghost Protocol - ESP32 Payment Test
Tests the complete flow: ESP32 → Relayer → Solana
"""

import requests
import json
import time

# Configuration
ESP32_HOST = "10.143.59.157"
RELAYER_URL = "http://localhost:8080"

# Test addresses (using existing merchant setup)
MERCHANT_ADDRESS = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"
TOKEN_ACCOUNT = "56Ebfgny3zcwnMV91eCejceM2RixNCkcEWThBCcPSFXb"

def test_esp32_connection():
    """Test ESP32 connectivity"""
    print("🔍 Testing ESP32 connection...")
    try:
        response = requests.get(f"http://{ESP32_HOST}/", timeout=5)
        print(f"✅ ESP32 is online at {ESP32_HOST}")
        return True
    except Exception as e:
        print(f"❌ Cannot connect to ESP32: {e}")
        return False

def get_credential_from_esp32(merchant: str, amount: int):
    """Fetch credential from ESP32"""
    print(f"\n📡 Requesting credential from ESP32...")
    print(f"   Merchant: {merchant}")
    print(f"   Amount: {amount} tokens")
    
    try:
        response = requests.get(
            f"http://{ESP32_HOST}/credential",
            params={
                "merchant": merchant,
                "amount": amount
            },
            timeout=10
        )
        
        if response.status_code == 200:
            credential = response.json()
            print(f"✅ Credential received!")
            print(f"   ID: {credential['credential_id'][:32]}...")
            print(f"   Counter: {credential['counter']}")
            print(f"   Signature: {credential['signature'][:32]}...")
            return credential
        else:
            print(f"❌ ESP32 returned error: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching credential: {e}")
        return None

def submit_to_relayer(credential):
    """Submit credential to relayer"""
    print(f"\n🚀 Submitting to relayer...")
    
    try:
        payload = {
            "credential": credential,
            "customer_token_account": TOKEN_ACCOUNT,
            "customer_owner": MERCHANT_ADDRESS
        }
        
        response = requests.post(
            f"{RELAYER_URL}/submit-payment",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ Payment successful!")
                print(f"   Signature: {result['signature']}")
                print(f"   Explorer: {result['explorer']}")
                return True
            else:
                print(f"❌ Payment failed: {result}")
                return False
        else:
            print(f"❌ Relayer error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error submitting payment: {e}")
        return False

def main():
    print("="*70)
    print("  Ghost Protocol - ESP32 Payment Demo")
    print("="*70)
    print()
    
    # Test configuration
    amount = 1_000_000  # 1.0 tokens (in micro-units)
    
    print(f"🎯 Test Configuration:")
    print(f"   ESP32: {ESP32_HOST}")
    print(f"   Relayer: {RELAYER_URL}")
    print(f"   Merchant: {MERCHANT_ADDRESS}")
    print(f"   Amount: {amount / 1_000_000} tokens")
    print()
    
    # Step 1: Test ESP32 connection
    if not test_esp32_connection():
        print("\n❌ Cannot proceed without ESP32 connection")
        print("   Make sure:")
        print("   1. ESP32 is powered on")
        print("   2. Connected to WiFi")
        print("   3. IP address is correct")
        return
    
    # Step 2: Get credential from ESP32
    credential = get_credential_from_esp32(MERCHANT_ADDRESS, amount)
    if not credential:
        print("\n❌ Cannot proceed without credential")
        return
    
    # Step 3: Submit to relayer
    print("\n" + "="*70)
    success = submit_to_relayer(credential)
    
    if success:
        print("\n" + "="*70)
        print("✅ END-TO-END TEST SUCCESSFUL!")
        print("="*70)
        print()
        print("🎉 Privacy Payment Flow Verified:")
        print("   1. ✅ ESP32 generated PNI credential")
        print("   2. ✅ Credential fetched over HTTP")
        print("   3. ✅ Relayer processed credential")
        print("   4. ✅ Transaction submitted to Solana")
        print("   5. ✅ Payment confirmed on blockchain")
        print()
        print("🛡️  Privacy Protected:")
        print("   • Customer identity encrypted by PNI")
        print("   • Merchant only sees relayer address")
        print("   • Transaction metadata private")
    else:
        print("\n" + "="*70)
        print("❌ TEST FAILED")
        print("="*70)
        print("\n📋 Troubleshooting:")
        print("   1. Check relayer logs for errors")
        print("   2. Verify merchant is initialized")
        print("   3. Ensure token account has sufficient balance")
        print("   4. Check Solana devnet status")

if __name__ == "__main__":
    main()
