#!/usr/bin/env python3
"""
Register a test card with the relayer
"""
import asyncio
import httpx
import hashlib

async def register_test_card():
    # Test card number
    card_number = "4532123456789012"
    card_hash = hashlib.sha256(card_number.encode()).hexdigest()
    
    # Test vault pubkey (in production, this would be the user's actual vault)
    # Using a valid devnet address for testing - this should be a real user's vault PDA
    test_vault = "8xYgbf3DUzs9mRCuVsVvNSb7vr6KMutAjCb7ys8jj57U"  # Example devnet address
    
    print("📝 Registering test card...")
    print(f"   Card: {card_number[:4]}****{card_number[-4:]}")
    print(f"   Hash: {card_hash[:16]}...")
    print(f"   Vault: {test_vault}")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://localhost:8080/api/v1/register_card",
                json={
                    "card_hash": card_hash,
                    "vault_pubkey": test_vault,
                },
                timeout=10.0,
            )
            
            if response.status_code == 200:
                print("✅ Card registered successfully!")
                print("\nNow you can test payments with:")
                print("  python3 merchant_terminal_simulator.py")
            else:
                print(f"❌ Registration failed: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(register_test_card())
