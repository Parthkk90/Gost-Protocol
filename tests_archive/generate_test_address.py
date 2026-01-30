#!/usr/bin/env python3
"""
Generate a new devnet address for testing
"""

from solders.keypair import Keypair
from solders.pubkey import Pubkey
import json

# Generate new keypair
new_keypair = Keypair()

# Get the public key (address)
new_address = str(new_keypair.pubkey())

print("="*60)
print("  New Devnet Test Address Generated")
print("="*60)
print()
print(f"🔑 New Address: {new_address}")
print(f"🔐 Private Key: {list(bytes(new_keypair))}")
print()

# Save the keypair to file
keypair_data = list(bytes(new_keypair))
with open('test-recipient-keypair.json', 'w') as f:
    json.dump(keypair_data, f)

print("✅ Keypair saved to: test-recipient-keypair.json")
print(f"🌐 Explorer: https://explorer.solana.com/address/{new_address}?cluster=devnet")
print()
print("📋 Use this address as NEW_RECIPIENT_ADDRESS in your code:")
print(f'NEW_RECIPIENT_ADDRESS = "{new_address}"')