#!/usr/bin/env python3
"""
Debug script to verify ESP32 credential matches Solana contract's expected format
"""

import hashlib
import struct
import requests
import base58

ESP32_HOST = "192.168.1.6"
MERCHANT_PUBKEY = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"

def derive_credential_id_like_contract(signature: bytes, counter: int, merchant_bytes: bytes, timestamp: int, customer_bytes: bytes) -> bytes:
    """Exactly matches Solana contract's derive_credential_id"""
    hasher = hashlib.sha256()
    hasher.update(signature)                          # 32 bytes
    hasher.update(struct.pack("<Q", counter))         # u64 little-endian
    hasher.update(merchant_bytes)                     # 32 bytes
    hasher.update(struct.pack("<q", timestamp))       # i64 little-endian
    hasher.update(customer_bytes)                     # 32 bytes
    return hasher.digest()

def main():
    # Convert base58 pubkey to hex (what we send to ESP32)
    merchant_bytes = base58.b58decode(MERCHANT_PUBKEY)
    merchant_hex = merchant_bytes.hex()
    customer_hex = merchant_hex  # Same for testing
    
    print("=" * 60)
    print("DEBUG: Credential Verification")
    print("=" * 60)
    print(f"\nMerchant Base58: {MERCHANT_PUBKEY}")
    print(f"Merchant Hex: {merchant_hex}")
    print(f"Merchant Bytes: {merchant_bytes.hex()}")
    
    # Request credential from ESP32
    print(f"\nRequesting credential from ESP32 at {ESP32_HOST}...")
    url = f"http://{ESP32_HOST}/credential"
    params = {
        "merchant": merchant_hex,
        "amount": 5250000,
        "customer": customer_hex
    }
    
    try:
        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        cred = resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return
    
    print("\n" + "=" * 60)
    print("ESP32 Credential Response:")
    print("=" * 60)
    for key, value in cred.items():
        print(f"  {key}: {value}")
    
    # Parse credential data
    esp32_credential_id = bytes.fromhex(cred["credential_id"])
    signature = bytes.fromhex(cred["signature"])
    counter = int(cred["counter"])
    timestamp = int(cred["timestamp"])
    esp32_merchant_hex = cred["merchant_pubkey"]
    esp32_customer_hex = cred.get("customer_owner", esp32_merchant_hex)
    
    # Convert ESP32's hex to bytes
    esp32_merchant_bytes = bytes.fromhex(esp32_merchant_hex)
    esp32_customer_bytes = bytes.fromhex(esp32_customer_hex)
    
    print("\n" + "=" * 60)
    print("Parsed Values:")
    print("=" * 60)
    print(f"  Signature (first 16): {signature[:16].hex()}")
    print(f"  Counter: {counter}")
    print(f"  Counter LE bytes: {struct.pack('<Q', counter).hex()}")
    print(f"  Timestamp: {timestamp}")
    print(f"  Timestamp LE bytes: {struct.pack('<q', timestamp).hex()}")
    print(f"  Merchant bytes: {esp32_merchant_bytes.hex()}")
    print(f"  Customer bytes: {esp32_customer_bytes.hex()}")
    print(f"  ESP32 Credential ID: {esp32_credential_id.hex()}")
    
    # Compute what the contract would compute
    expected_full = derive_credential_id_like_contract(
        signature,
        counter,
        esp32_merchant_bytes,
        timestamp,
        esp32_customer_bytes
    )
    expected_id = expected_full[:16]
    
    print("\n" + "=" * 60)
    print("Contract Verification:")
    print("=" * 60)
    print(f"  Expected full hash: {expected_full.hex()}")
    print(f"  Expected ID (first 16): {expected_id.hex()}")
    print(f"  ESP32 ID:               {esp32_credential_id.hex()}")
    
    if expected_id == esp32_credential_id:
        print("\n✅ MATCH! ESP32 credential_id matches contract expectation")
    else:
        print("\n❌ MISMATCH! ESP32 credential_id does NOT match")
        print("\nDifference analysis:")
        for i, (a, b) in enumerate(zip(expected_id, esp32_credential_id)):
            if a != b:
                print(f"  Byte {i}: expected {a:02x}, got {b:02x}")
    
    # Also verify the input bytes match what we sent
    print("\n" + "=" * 60)
    print("Input Verification:")
    print("=" * 60)
    if esp32_merchant_bytes == merchant_bytes:
        print("✅ Merchant bytes match what we sent")
    else:
        print("❌ Merchant bytes MISMATCH")
        print(f"   Sent:     {merchant_bytes.hex()}")
        print(f"   Received: {esp32_merchant_bytes.hex()}")

if __name__ == "__main__":
    main()
