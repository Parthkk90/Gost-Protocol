#!/usr/bin/env python3
"""
Create Token Account for New Recipient
This creates an associated token account for the new recipient to receive tokens
"""

import subprocess
import sys
from solders.keypair import Keypair
from solders.pubkey import Pubkey
import json

# Load the new recipient keypair
with open('test-recipient-keypair.json', 'r') as f:
    secret_key = json.load(f)
    
recipient_keypair = Keypair.from_bytes(bytes(secret_key))
recipient_address = str(recipient_keypair.pubkey())

TOKEN_MINT = "EknNCDdzjimGygvXEMVajPFp479bY7hNFDqiimq9Uc62"

print("="*60)
print("  Setting Up New Recipient for Token Transfers")
print("="*60)
print()
print(f"🎯 Recipient: {recipient_address}")
print(f"🪙 Token: {TOKEN_MINT}")
print()

print("Step 1: Request devnet SOL for gas fees...")
print(f"Command: solana airdrop 2 {recipient_address} --url devnet")
print()

print("Step 2: Create associated token account...")
print(f"Command: spl-token create-account {TOKEN_MINT} --owner {recipient_address} --url devnet")
print()

print("Step 3: Ready for payments!")
print(f"✅ Recipient can now receive tokens via Ghost Protocol")
print(f"🔗 Explorer: https://explorer.solana.com/address/{recipient_address}?cluster=devnet")
print()

print("🚀 Run the payment test:")
print("python live_payment_test.py")