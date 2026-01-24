"""
Ghost Protocol - Client Application
User-facing payment client that orchestrates ESP32 ↔ Relayer ↔ Solana flow

This client:
1. Connects to ESP32 hardware
2. Requests payment credentials
3. Forwards to relayer service
4. Monitors transaction status
"""

import requests
import json
import time
import os
from pathlib import Path
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solana.rpc.api import Client
from dotenv import load_dotenv
import argparse

load_dotenv()

# Configuration
ESP32_HOST = os.getenv("ESP32_HOST", "192.168.1.100")
RELAYER_URL = os.getenv("RELAYER_URL", "http://localhost:8080")
SOLANA_RPC = os.getenv("SOLANA_RPC", "https://api.devnet.solana.com")
WALLET_PATH = os.getenv("WALLET_PATH", "~/.config/solana/id.json")

class GhostPaymentClient:
    def __init__(self):
        self.esp32_url = f"http://{ESP32_HOST}"
        self.relayer_url = RELAYER_URL
        self.solana_client = Client(SOLANA_RPC)
        
        # Load wallet (for token account lookups, NOT for signing!)
        wallet_path = Path(WALLET_PATH).expanduser()
        if wallet_path.exists():
            with open(wallet_path, 'r') as f:
                secret = json.load(f)
                self.wallet = Keypair.from_bytes(bytes(secret))
            print(f"[Client] Loaded wallet: {self.wallet.pubkey()}")
        else:
            print(f"[Client] ⚠️  Wallet not found at {wallet_path}")
            # For testing, we'll use merchant pubkey as owner
            self.wallet = None
            print(f"[Client] Will use merchant pubkey for token account")
    
    def check_esp32_status(self):
        """Check if ESP32 is reachable and operational"""
        try:
            resp = requests.get(f"{self.esp32_url}/status", timeout=5)
            resp.raise_for_status()
            status = resp.json()
            
            print("\n[ESP32] Status:")
            print(f"  PNI Active: {status['pni_active']}")
            print(f"  PNI Age: {status['pni_age_hours']} hours")
            print(f"  Counter: {status['transaction_counter']}")
            print(f"  Mimicry Active: {status['mimicry_active']}")
            print(f"  Decoys Sent: {status['decoys_sent']}")
            
            return True
        except Exception as e:
            print(f"[ESP32] ❌ Not reachable: {e}")
            return False
    
    def check_relayer_health(self):
        """Check if relayer service is operational"""
        try:
            resp = requests.get(f"{self.relayer_url}/health", timeout=5)
            resp.raise_for_status()
            health = resp.json()
            
            print("\n[Relayer] Health:")
            print(f"  Status: {health['status']}")
            print(f"  Solana Connected: {health['solana_connected']}")
            print(f"  Relayer Balance: {health['relayer_balance']:.4f} SOL")
            print(f"  Relayer Pubkey: {health['relayer_pubkey']}")
            
            if health['relayer_balance'] < 0.01:
                print("  ⚠️  Low balance! Please fund relayer.")
            
            return health['status'] == 'healthy'
        except Exception as e:
            print(f"[Relayer] ❌ Not reachable: {e}")
            return False
    
    def get_token_account(self, mint: str):
        """Get associated token account for wallet"""
        if not self.wallet:
            raise Exception("Wallet not loaded")
        
        mint_pk = Pubkey.from_string(mint)
        
        # Derive ATA using standard program IDs
        TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        ASSOCIATED_TOKEN_PROGRAM_ID = Pubkey.from_string("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
        
        # Find associated token address
        seeds = [
            bytes(self.wallet.pubkey()),
            bytes(TOKEN_PROGRAM_ID),
            bytes(mint_pk)
        ]
        token_account, _ = Pubkey.find_program_address(seeds, ASSOCIATED_TOKEN_PROGRAM_ID)
        
        print(f"\n[Token] Account: {token_account}")
        
        # Check if account exists and has balance
        try:
            account_info = self.solana_client.get_token_account_balance(token_account)
            balance = account_info.value.ui_amount
            print(f"[Token] Balance: {balance}")
            
            if balance == 0:
                print("[Token] ⚠️  Zero balance!")
            
            return str(token_account)
        except Exception as e:
            print(f"[Token] ❌ Account error: {e}")
            raise
    
    def request_credential_from_esp32(self, merchant_pubkey: str, amount: int, customer_owner: str):
        """Request payment credential from ESP32"""
        print(f"\n[ESP32] Requesting credential...")
        print(f"[ESP32] Merchant: {merchant_pubkey}")
        print(f"[ESP32] Customer: {customer_owner}")
        print(f"[ESP32] Amount: {amount}")
        
        # Convert base58 pubkeys to hex for ESP32
        import base58
        merchant_hex = base58.b58decode(merchant_pubkey).hex()
        customer_hex = base58.b58decode(customer_owner).hex()
        
        try:
            params = {
                "merchant": merchant_hex,
                "amount": amount,
                "customer": customer_hex
            }
            
            resp = requests.get(
                f"{self.esp32_url}/credential",
                params=params,
                timeout=60  # Increased timeout for storm
            )
            resp.raise_for_status()
            
            credential = resp.json()
            
            print(f"[ESP32] ✅ Credential received")
            print(f"[ESP32] ID: {credential['credential_id'][:16]}...")
            print(f"[ESP32] Counter: {credential['counter']}")
            print(f"[ESP32] Valid for: {credential['valid_until'] - credential['timestamp']}s")
            
            return credential
        except Exception as e:
            print(f"[ESP32] ❌ Failed to get credential: {e}")
            raise
    
    def submit_to_relayer(self, credential: dict, customer_token_account: str):
        """Submit credential to relayer for blockchain submission"""
        print(f"\n[Relayer] Submitting payment...")
        
        # Determine customer owner (wallet owner for token account)
        if self.wallet:
            customer_owner = str(self.wallet.pubkey())
        elif "customer_owner" in credential:
            # Use customer_owner from credential (hex format)
            customer_owner = credential["customer_owner"]
        else:
            # Default to merchant pubkey (for testing when wallet not available)
            customer_owner = credential.get("merchant_pubkey", "FEEVdMzQFUEZQuX9nUtNCJcBecn3TArdKn5e7p64VNLe")
        
        try:
            payload = {
                "credential": credential,
                "customer_token_account": customer_token_account,
                "customer_owner": customer_owner
            }
            
            resp = requests.post(
                f"{self.relayer_url}/submit-payment",
                json=payload,
                timeout=30
            )
            resp.raise_for_status()
            
            result = resp.json()
            
            if result.get("success"):
                print(f"[Relayer] ✅ Payment submitted!")
                print(f"[Relayer] Signature: {result['signature']}")
                if "note" in result:
                    print(f"[Relayer] Note: {result['note']}")
                return result
            else:
                print(f"[Relayer] ❌ Payment failed: {result.get('error')}")
                return None
        except Exception as e:
            print(f"[Relayer] ❌ Submission failed: {e}")
            raise
    
    def make_payment(self, merchant_pubkey: str, amount: float, token_mint: str, token_account: str = None):
        """
        Complete payment flow
        
        Args:
            merchant_pubkey: Merchant's Solana public key
            amount: Amount in token units (e.g., 5.25 USDC)
            token_mint: Token mint address
            token_account: Optional token account (if wallet not available)
        """
        print("\n" + "="*60)
        print("  Ghost Protocol - Privacy Payment")
        print("="*60)
        
        # Convert amount to micro-units (assuming 6 decimals like USDC)
        amount_lamports = int(amount * 1_000_000)
        
        print(f"\nPayment Details:")
        print(f"  Merchant: {merchant_pubkey}")
        print(f"  Amount: {amount} tokens ({amount_lamports} micro-units)")
        print(f"  Token Mint: {token_mint}")
        
        # Step 1: Pre-flight checks
        print("\n" + "-"*60)
        print("Step 1: Pre-flight checks")
        print("-"*60)
        
        if not self.check_esp32_status():
            print("\n❌ ESP32 not ready. Please check connection.")
            return False
        
        if not self.check_relayer_health():
            print("\n❌ Relayer not ready. Please start relayer service.")
            return False
        
        # Step 2: Get token account
        print("\n" + "-"*60)
        print("Step 2: Get token account")
        print("-"*60)
        
        if not token_account:
            try:
                token_account = self.get_token_account(token_mint)
            except Exception as e:
                print(f"\n❌ Failed to get token account: {e}")
                return False
        else:
            print(f"\n✅ Using provided token account: {token_account}")
        
        # Determine customer owner
        if self.wallet:
            customer_owner = str(self.wallet.pubkey())
        else:
            # Use merchant pubkey as customer for testing
            customer_owner = merchant_pubkey
        
        # Step 3: Request credential from ESP32
        print("\n" + "-"*60)
        print("Step 3: Request credential from ESP32")
        print("-"*60)
        print("⚡ This will trigger mimicry storm...")
        
        try:
            credential = self.request_credential_from_esp32(
                merchant_pubkey,
                amount_lamports,
                customer_owner
            )
        except Exception as e:
            print(f"\n❌ Failed to get credential: {e}")
            return False
        
        # Step 4: Submit to relayer
        print("\n" + "-"*60)
        print("Step 4: Submit to Solana via relayer")
        print("-"*60)
        
        try:
            result = self.submit_to_relayer(credential, token_account)
            if not result:
                return False
        except Exception as e:
            print(f"\n❌ Failed to submit: {e}")
            return False
        
        # Success!
        print("\n" + "="*60)
        print("  ✅ Payment Complete!")
        print("="*60)
        print(f"\nTransaction: {result['signature']}")
        print(f"\nPrivacy Features:")
        print(f"  ✓ Your wallet address NOT exposed to merchant")
        print(f"  ✓ Transaction buried in decoy storm")
        print(f"  ✓ Relayer paid gas fees")
        print(f"  ✓ One-time credential burned")
        print(f"  ✓ Payment unlinkable to previous transactions")
        print("\n" + "="*60 + "\n")
        
        return True

def main():
    parser = argparse.ArgumentParser(
        description="Ghost Protocol - Privacy Payment Client"
    )
    parser.add_argument(
        "--merchant",
        help="Merchant Solana public key"
    )
    parser.add_argument(
        "--amount",
        type=float,
        help="Payment amount (e.g., 5.25)"
    )
    parser.add_argument(
        "--token",
        default="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        help="Token mint address (default: USDC devnet)"
    )
    parser.add_argument(
        "--token-account",
        help="Customer token account (if wallet not available)"
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Only check system status, don't make payment"
    )
    
    args = parser.parse_args()
    
    client = GhostPaymentClient()
    
    if args.check_only:
        print("\n=== System Status Check ===\n")
        client.check_esp32_status()
        client.check_relayer_health()
        return
    
    # Validate required arguments for payment
    if not args.merchant or not args.amount:
        parser.error("--merchant and --amount are required for making payments")
    
    # Make payment
    success = client.make_payment(
        args.merchant,
        args.amount,
        args.token,
        args.token_account
    )
    
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
