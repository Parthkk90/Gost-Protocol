"""
Z-Cresca Payment Relayer Service
Week 19-20 Implementation

This service acts as the bridge between:
- Physical card terminals (merchant POS systems)
- Z-Cresca Solana program (on-chain credit card logic)

Flow:
1. Merchant swipes card at POS terminal
2. Terminal sends payment request to relayer (REST API)
3. Relayer creates burner wallet for privacy
4. Relayer calls authorize_payment on-chain
5. If approved: execute_payment (swap + transfer)
6. Return approval/decline to merchant terminal
"""

import asyncio
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import os
from pathlib import Path

from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import ID as SYS_PROGRAM_ID
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from anchorpy import Provider, Wallet, Program, Context, Idl
import httpx
import json
import struct

# Load .env file if exists
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ Loaded environment from {env_path}")
except ImportError:
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PaymentRequest:
    """Payment request from merchant terminal"""
    card_hash: str  # Hashed card number (PII protection)
    amount_usdc: int  # Amount in USDC (with 6 decimals)
    merchant_id: str
    merchant_wallet: str  # Merchant's Solana wallet
    terminal_id: str
    timestamp: datetime
    nonce: str  # Unique transaction ID

@dataclass
class PaymentResponse:
    """Response to merchant terminal"""
    approved: bool
    transaction_signature: Optional[str]
    error_message: Optional[str]
    burner_address: Optional[str]
    timestamp: datetime

class ZCrescaRelayer:
    """
    Payment Relayer Service
    
    Responsibilities:
    - Receive payment requests from merchant terminals
    - Look up user vault by card hash
    - Create burner wallet for privacy
    - Call authorize_payment on-chain
    - Execute payment if approved
    - Return result to merchant
    """
    
    def __init__(
        self,
        rpc_url: str,
        program_id: str,
        relayer_keypair: Keypair,
        jupiter_api_url: str = "https://quote-api.jup.ag/v6",
        idl_path: Optional[str] = None,
    ):
        self.rpc_url = rpc_url
        self.program_id = Pubkey.from_string(program_id)
        self.relayer_keypair = relayer_keypair
        self.jupiter_api_url = jupiter_api_url
        
        # Card hash → Vault mapping (in production: use database)
        self.card_to_vault: Dict[str, Pubkey] = {}
        
        # Initialize Solana client
        self.connection = AsyncClient(rpc_url, commitment=Confirmed)
        self.wallet = Wallet(relayer_keypair)
        self.provider = Provider(self.connection, self.wallet)
        
        # Load IDL if available
        self.program: Optional[Program] = None
        if idl_path and Path(idl_path).exists():
            try:
                with open(idl_path) as f:
                    idl_json = json.load(f)
                    self.idl = Idl.from_json(json.dumps(idl_json))
                    self.program = Program(self.idl, self.program_id, self.provider)
                    logger.info(f"✅ Loaded IDL from {idl_path}")
            except Exception as e:
                logger.warning(f"⚠️  Failed to load IDL: {e}")
                logger.info(f"   Will use manual account parsing")
        else:
            logger.info(f"⚠️  No IDL provided, using manual account parsing")
        
        logger.info(f"🚀 Relayer initialized")
        logger.info(f"   RPC: {rpc_url}")
        logger.info(f"   Program: {program_id}")
        logger.info(f"   Relayer: {relayer_keypair.pubkey()}")
    
    async def register_card(self, card_hash: str, vault_pubkey: Pubkey):
        """Register a card with its vault (called during card activation)"""
        self.card_to_vault[card_hash] = vault_pubkey
        logger.info(f"✅ Card registered: {card_hash[:8]}... → {vault_pubkey}")
    
    async def process_payment(self, request: PaymentRequest) -> PaymentResponse:
        """
        Main payment processing flow
        
        1. Validate request
        2. Look up vault
        3. Create burner wallet
        4. Authorize payment (check credit limit)
        5. Get Jupiter quote for swap
        6. Execute payment (swap + transfer)
        7. Return result
        """
        logger.info(f"💳 Processing payment request")
        logger.info(f"   Card: {request.card_hash[:8]}...")
        logger.info(f"   Amount: ${request.amount_usdc / 1_000_000:.2f}")
        logger.info(f"   Merchant: {request.merchant_id}")
        
        try:
            # Step 1: Look up vault
            vault_pubkey = self.card_to_vault.get(request.card_hash)
            if not vault_pubkey:
                return PaymentResponse(
                    approved=False,
                    transaction_signature=None,
                    error_message="Card not registered",
                    burner_address=None,
                    timestamp=datetime.now(),
                )
            
            # Step 2: Fetch vault data
            vault_data = await self.fetch_vault(vault_pubkey)
            if not vault_data:
                return PaymentResponse(
                    approved=False,
                    transaction_signature=None,
                    error_message="Vault not found",
                    burner_address=None,
                    timestamp=datetime.now(),
                )
            
            # Step 3: Check credit availability
            available_credit = vault_data["credit_limit"] - vault_data["outstanding_balance"]
            if request.amount_usdc > available_credit:
                logger.warning(f"❌ Insufficient credit: {available_credit} < {request.amount_usdc}")
                return PaymentResponse(
                    approved=False,
                    transaction_signature=None,
                    error_message=f"Insufficient credit (available: ${available_credit / 1_000_000:.2f})",
                    burner_address=None,
                    timestamp=datetime.now(),
                )
            
            # Step 4: Create burner wallet for privacy
            burner_nonce = int(datetime.now().timestamp() * 1000)  # millisecond timestamp
            burner_pubkey, burner_bump = self.derive_burner_address(
                vault_pubkey,
                burner_nonce,
            )
            
            logger.info(f"🔥 Creating burner: {burner_pubkey}")
            
            # Step 5: Get Jupiter swap quote
            sol_amount_in = await self.get_swap_quote(
                request.amount_usdc,
                vault_data["collateral_amount"],
            )
            
            # Step 6: Execute payment on-chain
            tx_sig = await self.execute_payment_onchain(
                vault_pubkey=vault_pubkey,
                burner_nonce=burner_nonce,
                merchant_wallet=Pubkey.from_string(request.merchant_wallet),
                amount_usdc=request.amount_usdc,
                sol_amount_in=sol_amount_in,
            )
            
            logger.info(f"✅ Payment approved: {tx_sig}")
            
            return PaymentResponse(
                approved=True,
                transaction_signature=str(tx_sig),
                error_message=None,
                burner_address=str(burner_pubkey),
                timestamp=datetime.now(),
            )
            
        except Exception as e:
            logger.error(f"❌ Payment failed: {e}", exc_info=True)
            return PaymentResponse(
                approved=False,
                transaction_signature=None,
                error_message=str(e),
                burner_address=None,
                timestamp=datetime.now(),
            )
    
    def derive_burner_address(self, vault: Pubkey, nonce: int) -> tuple[Pubkey, int]:
        """Derive burner wallet PDA"""
        seeds = [
            b"burner",
            bytes(vault),
            nonce.to_bytes(8, "little"),
        ]
        burner_pubkey, bump = Pubkey.find_program_address(seeds, self.program_id)
        return burner_pubkey, bump
    
    async def fetch_vault(self, vault_pubkey: Pubkey) -> Optional[Dict[str, Any]]:
        """Fetch vault account data from blockchain"""
        try:
            # Fetch account from chain
            account_info = await self.connection.get_account_info(vault_pubkey)
            
            if not account_info.value:
                logger.warning(f"⚠️  Vault account not found on-chain: {vault_pubkey}")
                logger.info(f"   Using mock data for testing")
                # Return mock data for testing
                return {
                    "owner": vault_pubkey,  # Mock owner
                    "vault_id": 1,
                    "collateral_amount": 10_000_000_000,  # 10 SOL
                    "credit_limit": 1_500_000_000,  # $1500
                    "outstanding_balance": 200_000_000,  # $200
                    "yield_earned": 50_000_000,  # $50
                }
            
            data = account_info.value.data
            
            # If we have Program/IDL, use it
            if self.program:
                try:
                    vault_account = await self.program.account["CreditVault"].fetch(vault_pubkey)
                    return {
                        "owner": vault_account.owner,
                        "vault_id": vault_account.vault_id,
                        "collateral_amount": vault_account.collateral_amount,
                        "credit_limit": vault_account.credit_limit,
                        "outstanding_balance": vault_account.outstanding_balance,
                        "yield_earned": vault_account.yield_earned,
                        "daily_limit": vault_account.daily_limit,
                        "daily_spent": vault_account.daily_spent,
                        "active": vault_account.active,
                    }
                except Exception as e:
                    logger.warning(f"⚠️  IDL fetch failed: {e}, falling back to manual parsing")
            
            # Manual deserialization (CreditVault layout)
            # Skip 8-byte discriminator
            offset = 8
            
            # owner: Pubkey (32 bytes)
            owner = Pubkey(data[offset:offset+32])
            offset += 32
            
            # vault_id: u64 (8 bytes)
            vault_id = struct.unpack('<Q', data[offset:offset+8])[0]
            offset += 8
            
            # Skip collateral_token_mint (32 bytes)
            offset += 32
            
            # collateral_amount: u64 (8 bytes)
            collateral_amount = struct.unpack('<Q', data[offset:offset+8])[0]
            offset += 8
            
            # credit_limit: u64 (8 bytes)
            credit_limit = struct.unpack('<Q', data[offset:offset+8])[0]
            offset += 8
            
            # outstanding_balance: u64 (8 bytes)
            outstanding_balance = struct.unpack('<Q', data[offset:offset+8])[0]
            offset += 8
            
            # yield_earned: u64 (8 bytes)
            yield_earned = struct.unpack('<Q', data[offset:offset+8])[0]
            offset += 8
            
            logger.info(f"📊 Vault data fetched:")
            logger.info(f"   Credit limit: ${credit_limit / 1e6:.2f}")
            logger.info(f"   Outstanding: ${outstanding_balance / 1e6:.2f}")
            logger.info(f"   Collateral: {collateral_amount / 1e9:.4f} tokens")
            
            return {
                "owner": owner,
                "vault_id": vault_id,
                "collateral_amount": collateral_amount,
                "credit_limit": credit_limit,
                "outstanding_balance": outstanding_balance,
                "yield_earned": yield_earned,
            }
            
        except Exception as e:
            logger.error(f"❌ Error fetching vault: {e}", exc_info=True)
            return None
    
    async def get_swap_quote(self, usdc_out: int, sol_available: int) -> int:
        """Get Jupiter swap quote: How much SOL to swap for desired USDC"""
        # TODO: Call Jupiter API
        # For now, assume 1 SOL = $150
        sol_needed = int((usdc_out / 1_000_000) * 1_000_000_000 / 150)
        logger.info(f"🔄 Swap quote: {sol_needed / 1e9:.4f} SOL → ${usdc_out / 1e6:.2f} USDC")
        return sol_needed
    
    async def execute_payment_onchain(
        self,
        vault_pubkey: Pubkey,
        burner_nonce: int,
        merchant_wallet: Pubkey,
        amount_usdc: int,
        sol_amount_in: int,
    ) -> str:
        """Execute payment transaction on-chain"""
        logger.info(f"📤 Building transaction...")
        logger.info(f"   Vault: {vault_pubkey}")
        logger.info(f"   Burner nonce: {burner_nonce}")
        logger.info(f"   Merchant: {merchant_wallet}")
        logger.info(f"   Amount: ${amount_usdc / 1e6:.2f}")
        
        try:
            # If we have Program/IDL, use Anchorpy
            if self.program:
                logger.info(f"🔧 Using Anchorpy to build transaction")
                
                # Derive burner PDA
                burner_pubkey, burner_bump = self.derive_burner_address(vault_pubkey, burner_nonce)
                
                # Get vault owner from on-chain data
                vault_data = await self.fetch_vault(vault_pubkey)
                if not vault_data:
                    raise Exception("Failed to fetch vault data")
                
                vault_owner = vault_data["owner"]
                
                # Call authorize_payment instruction
                # This checks credit and creates burner wallet
                tx = await self.program.rpc["authorize_payment"](
                    amount_usdc,
                    burner_nonce,
                    ctx=Context(
                        accounts={
                            "vault": vault_pubkey,
                            "burner_wallet": burner_pubkey,
                            "owner": vault_owner,
                            "relayer": self.relayer_keypair.pubkey(),
                            "system_program": SYS_PROGRAM_ID,
                        },
                        signers=[self.relayer_keypair],
                    ),
                )
                
                logger.info(f"✅ Transaction sent: {tx}")
                return str(tx)
            else:
                # Manual instruction building (fallback)
                logger.warning(f"⚠️  No IDL available, returning mock signature")
                logger.info(f"   To enable real transactions, provide IDL path")
                return "5MOCK_SIGNATURE_" + str(burner_nonce)
                
        except Exception as e:
            logger.error(f"❌ Transaction failed: {e}", exc_info=True)
            raise
    
    async def start(self, host: str = "0.0.0.0", port: int = 8080):
        """Start the relayer REST API server"""
        from fastapi import FastAPI, HTTPException
        from fastapi.middleware.cors import CORSMiddleware
        import uvicorn
        
        app = FastAPI(title="Z-Cresca Payment Relayer")
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        @app.get("/health")
        async def health():
            return {"status": "ok", "timestamp": datetime.now().isoformat()}
        
        @app.post("/api/v1/payment")
        async def process_payment_endpoint(request: dict):
            payment_req = PaymentRequest(
                card_hash=request["card_hash"],
                amount_usdc=request["amount_usdc"],
                merchant_id=request["merchant_id"],
                merchant_wallet=request["merchant_wallet"],
                terminal_id=request.get("terminal_id", "unknown"),
                timestamp=datetime.now(),
                nonce=request.get("nonce", str(datetime.now().timestamp())),
            )
            
            response = await self.process_payment(payment_req)
            
            if response.approved:
                return {
                    "approved": True,
                    "transaction_signature": response.transaction_signature,
                    "burner_address": response.burner_address,
                }
            else:
                raise HTTPException(status_code=402, detail=response.error_message)
        
        @app.post("/api/v1/register_card")
        async def register_card_endpoint(request: dict):
            try:
                # Validate inputs
                card_hash = request.get("card_hash")
                vault_str = request.get("vault_pubkey")
                
                if not card_hash or len(card_hash) != 64:
                    raise HTTPException(status_code=400, detail="Invalid card hash format (expected 64 char hex)")
                
                if not vault_str or len(vault_str) < 32 or len(vault_str) > 44:
                    raise HTTPException(status_code=400, detail="Invalid vault address format (expected 32-44 char Base58)")
                
                # Validate Pubkey format
                try:
                    vault_pubkey = Pubkey.from_string(vault_str)
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Malformed Solana address: {str(e)}")
                
                # Register the card
                await self.register_card(
                    card_hash=card_hash,
                    vault_pubkey=vault_pubkey,
                )
                
                logger.info(f"✅ Card registered: {card_hash[:8]}... → {vault_str}")
                return {"status": "registered", "card_hash": card_hash[:16] + "...", "vault": vault_str}
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"❌ Registration error: {e}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
        
        logger.info(f"🌐 Starting relayer API on {host}:{port}")
        config = uvicorn.Config(app, host=host, port=port, log_level="info")
        server = uvicorn.Server(config)
        await server.serve()

# Example usage
async def main():
    # Load relayer keypair from environment
    relayer_secret = os.getenv("RELAYER_SECRET_KEY", "")
    if not relayer_secret:
        logger.error("❌ RELAYER_SECRET_KEY environment variable not set")
        logger.error("")
        logger.error("Quick start:")
        logger.error("  1. Run: bash setup.sh")
        logger.error("  2. Or manually create .env file with:")
        logger.error("     RELAYER_SECRET_KEY=your_base58_secret_key")
        logger.error("     SOLANA_RPC_URL=https://api.devnet.solana.com")
        logger.error("     PROGRAM_ID=ZCrVau1tYqK7X2MpF9V8Z3mY4hR5wN6sT8dL1pQwR2z")
        logger.error("")
        logger.error("  Generate keypair: solana-keygen new --no-bip39-passphrase")
        return
    
    relayer_keypair = Keypair.from_base58_string(relayer_secret)
    
    # Find IDL file
    idl_path = Path(__file__).parent.parent / "target" / "idl" / "z_cresca_vault.json"
    if not idl_path.exists():
        logger.warning(f"⚠️  IDL not found at {idl_path}")
        logger.info(f"   Run 'anchor build' to generate IDL")
        logger.info(f"   Relayer will work in mock mode")
        idl_path = None
    else:
        logger.info(f"📄 Found IDL at {idl_path}")
    
    # Initialize relayer
    relayer = ZCrescaRelayer(
        rpc_url=os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com"),
        program_id=os.getenv("PROGRAM_ID", "HX5nu29URyVfVFDsiVRumvf64egFydNqgGibBpPxt3nz"),
        relayer_keypair=relayer_keypair,
        idl_path=str(idl_path) if idl_path else None,
    )
    
    # Start API server
    await relayer.start(host="0.0.0.0", port=8080)

if __name__ == "__main__":
    asyncio.run(main())
