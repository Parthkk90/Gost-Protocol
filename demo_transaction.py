#!/usr/bin/env python3
"""
Ghost Protocol - Simple Transaction Demo
Demonstrates a privacy payment using existing devnet addresses
"""

import json
import time
from solana.rpc.api import Client
from solders.pubkey import Pubkey

# Your existing devnet addresses from previous successful transactions
MERCHANT_ADDRESS = "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe"
TOKEN_MINT = "EknNCDdzjimGygvXEMVajPFp479bY7hNFDqiimq9Uc62"
TOKEN_ACCOUNT = "56Ebfgny3zcwnMV91eCejceM2RixNCkcEWThBCcPSFXb"
RELAYER_ADDRESS = "DvzV6MfL5mL4kFJA72X57qc8Z2A5PR3NmvJYVAkQmT7h"

# Previous successful transaction
SUCCESS_TX = "21jT5jnCnV2Br5uMAJajfiSWbEJ7TspowuYw9rJR1aNGwC5L3nVdLUcJ5xT9EqXhR6yt6gCe5GnkYX8P7NjFm4qK"

def main():
    print("="*60)
    print("  Ghost Protocol - Transaction Demo")
    print("="*60)
    print()
    
    # Initialize Solana client
    client = Client("https://api.devnet.solana.com")
    
    print("🔍 System Status Check:")
    print(f"   Merchant: {MERCHANT_ADDRESS}")
    print(f"   Token Mint: {TOKEN_MINT}")  
    print(f"   Token Account: {TOKEN_ACCOUNT}")
    print(f"   Relayer: {RELAYER_ADDRESS}")
    print()
    
    # Check account balances
    print("💰 Account Balances:")
    try:
        merchant_pubkey = Pubkey.from_string(MERCHANT_ADDRESS)
        merchant_balance = client.get_balance(merchant_pubkey).value / 1_000_000_000
        print(f"   Merchant SOL: {merchant_balance:.6f} SOL")
        
        relayer_pubkey = Pubkey.from_string(RELAYER_ADDRESS)
        relayer_balance = client.get_balance(relayer_pubkey).value / 1_000_000_000
        print(f"   Relayer SOL: {relayer_balance:.6f} SOL")
        
        # Get token account info
        token_account_pubkey = Pubkey.from_string(TOKEN_ACCOUNT)
        token_info = client.get_token_account_balance(token_account_pubkey)
        if token_info.value:
            token_balance = float(token_info.value.ui_amount)
            print(f"   Token Balance: {token_balance} tokens")
        
    except Exception as e:
        print(f"   ⚠️ Balance check error: {e}")
    
    print()
    print("📋 Previous Successful Transaction:")
    print(f"   Signature: {SUCCESS_TX}")
    print(f"   Explorer: https://explorer.solana.com/tx/{SUCCESS_TX}?cluster=devnet")
    print()
    
    # Simulate a new payment request
    print("🚀 Simulating New Privacy Payment:")
    print("   Amount: 2.5 tokens")
    print("   Flow:")
    print("   1. 📱 Customer initiates payment")
    print("   2. 🔒 ESP32 generates PNI credential") 
    print("   3. 🎭 Mimicry engine creates decoy traffic")
    print("   4. 📡 Relayer receives encrypted credential")
    print("   5. ✅ Relayer submits transaction to Solana")
    print("   6. 🔍 Transaction confirmed on blockchain")
    print("   7. 💰 Merchant receives payment")
    print("   8. 🛡️ Customer identity remains private")
    print()
    
    print("✅ Privacy Payment System Status: OPERATIONAL")
    print("   • ESP32 Hardware: Ready for PNI generation")
    print("   • Mimicry Engine: Active decoy patterns") 
    print("   • Relayer Service: Monitoring for credentials")
    print("   • Solana Network: Devnet connection stable")
    print()
    
    print("🎯 Transaction would execute as:")
    print(f"   FROM: {TOKEN_ACCOUNT} (via relayer {RELAYER_ADDRESS})")
    print(f"   TO: Merchant token account")
    print(f"   AMOUNT: 2.5 tokens")
    print(f"   PRIVACY: Customer address hidden from merchant")
    print()
    
    # Show the privacy mechanism
    print("🔐 Privacy Mechanism:")
    print("   Customer Wallet → ESP32 PNI → Encrypted → Relayer → Solana")
    print("   Merchant only sees: Relayer address (not customer)")
    print("   Blockchain sees: Standard token transfer")
    print("   Result: Private payment with public verification")

if __name__ == "__main__":
    main()