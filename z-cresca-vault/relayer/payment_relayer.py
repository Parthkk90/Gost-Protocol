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
import base64
import hashlib

# Import ESP32 entropy provider
try:
    from esp32_entropy import ESP32EntropyProvider
    ESP32_AVAILABLE = True
except ImportError:
    ESP32_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("⚠️  esp32_entropy not found, using software fallback")

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
        privacy_cash_enabled: bool = True,
    ):
        self.rpc_url = rpc_url
        self.program_id = Pubkey.from_string(program_id)
        self.relayer_keypair = relayer_keypair
        self.jupiter_api_url = jupiter_api_url
        self.privacy_cash_enabled = privacy_cash_enabled
        
        # Card hash → Vault mapping (in production: use database)
        self.card_to_vault: Dict[str, Pubkey] = {}
        
        # Privacy Cash SDK - burner wallet cache
        self.privacy_burners: Dict[str, Dict[str, Any]] = {}  # nonce → burner data
        
        # Initialize Solana client
        self.connection = AsyncClient(rpc_url, commitment=Confirmed)
        self.wallet = Wallet(relayer_keypair)
        self.provider = Provider(self.connection, self.wallet)
        
        # Initialize httpx client for Jupiter API
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # Initialize Privacy Cash Service connection
        self.privacy_cash_service_url = os.getenv("PRIVACY_CASH_SERVICE_URL", "http://127.0.0.1:8081")
        self.use_privacy_cash_sdk = os.getenv("USE_PRIVACY_CASH_SDK", "true").lower() == "true"
        if self.use_privacy_cash_sdk:
            logger.info(f"🔐 Privacy Cash SDK: {self.privacy_cash_service_url}")
        
        # Initialize ESP32 entropy provider
        self.esp32_entropy: Optional[ESP32EntropyProvider] = None
        if privacy_cash_enabled and ESP32_AVAILABLE:
            esp32_url = os.getenv("ESP32_ENTROPY_URL")
            if esp32_url:
                self.esp32_entropy = ESP32EntropyProvider(esp32_url)
                logger.info(f"🎲 ESP32 entropy: {esp32_url}")
            else:
                logger.info(f"⚠️  ESP32_ENTROPY_URL not set, using software entropy")
        
        # Load IDL if available
        self.program: Optional[Program] = None
        self.idl_data: Optional[Dict] = None
        if idl_path and Path(idl_path).exists():
            try:
                with open(idl_path) as f:
                    self.idl_data = json.load(f)
                    # Store IDL data for manual instruction building
                    logger.info(f"✅ Loaded IDL data from {idl_path}")
                    logger.info(f"   Program address: {self.idl_data.get('address')}")
                    # Note: Anchorpy may not support Anchor 0.32+ format yet
                    # We'll use manual instruction building with IDL data
            except Exception as e:
                logger.warning(f"⚠️  Failed to load IDL: {e}")
                logger.info(f"   Will use manual account parsing")
        else:
            logger.info(f"⚠️  No IDL provided, using manual account parsing")
        
        logger.info(f"🚀 Relayer initialized")
        logger.info(f"   RPC: {rpc_url}")
        logger.info(f"   Program: {program_id}")
        logger.info(f"   Relayer: {relayer_keypair.pubkey()}")
        logger.info(f"🔐 Privacy Cash SDK: {'✅ Enabled' if self.privacy_cash_enabled else '❌ Disabled'}")
        logger.info(f"🌐 Jupiter API: {self.jupiter_api_url}")
    
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
            
            # Step 6: Execute payment (with Privacy Cash SDK if enabled)
            if self.use_privacy_cash_sdk:
                tx_sig = await self.execute_private_payment_with_sdk(
                    merchant_wallet=Pubkey.from_string(request.merchant_wallet),
                    amount_sol=sol_amount_in / 1e9,  # Convert lamports to SOL
                )
            else:
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
        try:
            # Token addresses
            SOL_MINT = "So11111111111111111111111111111111111111112"
            USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
            
            # Jupiter v6 API: Get quote for swapping SOL → USDC
            params = {
                "inputMint": SOL_MINT,
                "outputMint": USDC_MINT,
                "amount": usdc_out,  # Desired USDC output (6 decimals)
                "slippageBps": 50,  # 0.5% slippage
                "swapMode": "ExactOut",  # We want exact USDC output
            }
            
            logger.info(f"🔄 Requesting Jupiter quote...")
            logger.info(f"   Output: ${usdc_out / 1e6:.2f} USDC")
            
            response = await self.http_client.get(
                f"{self.jupiter_api_url}/quote",
                params=params,
            )
            
            if response.status_code != 200:
                logger.warning(f"⚠️  Jupiter API error: {response.status_code}")
                # Fallback to mock price
                sol_needed = int((usdc_out / 1_000_000) * 1_000_000_000 / 150)
                logger.info(f"   Using fallback: {sol_needed / 1e9:.4f} SOL")
                return sol_needed
            
            quote_data = response.json()
            sol_needed = int(quote_data["inAmount"])  # SOL in lamports
            price_impact = float(quote_data.get("priceImpactPct", 0))
            
            logger.info(f"✅ Jupiter quote received:")
            logger.info(f"   Input: {sol_needed / 1e9:.6f} SOL")
            logger.info(f"   Output: ${usdc_out / 1e6:.2f} USDC")
            logger.info(f"   Rate: 1 SOL = ${(usdc_out / 1e6) / (sol_needed / 1e9):.2f}")
            logger.info(f"   Price impact: {price_impact:.4f}%")
            
            return sol_needed
            
        except Exception as e:
            logger.error(f"❌ Jupiter API error: {e}")
            # Fallback to mock price
            sol_needed = int((usdc_out / 1_000_000) * 1_000_000_000 / 150)
            logger.info(f"   Using fallback: {sol_needed / 1e9:.4f} SOL")
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
    
    async def execute_private_payment_with_sdk(
        self,
        merchant_wallet: Pubkey,
        amount_sol: float,
    ) -> str:
        """
        Execute payment using Privacy Cash SDK via Node.js service
        
        This provides TRUE zero-knowledge privacy:
        - Deposit to privacy pool
        - Withdraw to merchant
        - Untraceable on-chain
        """
        logger.info(f"🔐 Using Privacy Cash SDK for payment")
        logger.info(f"   Amount: {amount_sol:.6f} SOL")
        logger.info(f"   Recipient: {merchant_wallet}")
        
        try:
            # Call Privacy Cash Service (Node.js)
            response = await self.http_client.post(
                f"{self.privacy_cash_service_url}/api/privacy/payment",
                json={
                    "amount_sol": amount_sol,
                    "recipient": str(merchant_wallet),
                },
                timeout=60.0,  # Privacy proofs can take time
            )
            
            if response.status_code != 200:
                error_data = response.json()
                raise Exception(f"Privacy Cash SDK error: {error_data.get('error')}")
            
            data = response.json()
            
            logger.info(f"✅ Private payment completed")
            logger.info(f"   Deposit tx: {data['deposit_signature'][:16]}...")
            logger.info(f"   Withdraw tx: {data['withdraw_signature'][:16]}...")
            logger.info(f"   Privacy: ✅ Merchant cannot link to vault")
            
            # Return the withdraw signature (this is what merchant sees)
            return data['withdraw_signature']
            
        except httpx.TimeoutException:
            logger.error("❌ Privacy Cash SDK timeout - service may not be running")
            logger.info("   Start service: node privacy_cash_service.mjs")
            raise Exception("Privacy Cash service unavailable")
        except Exception as e:
            logger.error(f"❌ Privacy Cash SDK error: {e}")
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
        
        # ===== VAULT ENDPOINTS =====
        
        @app.post("/api/v1/vault/create")
        async def create_vault_endpoint(request: dict):
            """Create new vault for user"""
            try:
                owner_pubkey = Pubkey.from_string(request["owner_pubkey"])
                sol_amount = float(request["sol_amount"])
                
                # Create vault on-chain (placeholder - implement actual on-chain call)
                logger.info(f"📦 Creating vault for {owner_pubkey} with {sol_amount} SOL")
                
                return {
                    "vault_address": str(owner_pubkey),  # Mock: use owner as vault for now
                    "credit_limit": sol_amount * 1.5,  # 150% LTV
                    "collateral_amount": sol_amount,
                }
            except Exception as e:
                logger.error(f"❌ Vault creation error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/api/v1/vault/{vault_address}")
        async def get_vault_endpoint(vault_address: str):
            """Get vault details"""
            try:
                vault_pubkey = Pubkey.from_string(vault_address)
                
                # Mock response - implement actual on-chain fetch
                return {
                    "vault_address": vault_address,
                    "collateral_amount": 2.5,
                    "credit_limit": 3.75,
                    "outstanding_balance": 1.2,
                    "health_factor": 175,
                    "ltv_ratio": 150,
                }
            except Exception as e:
                raise HTTPException(status_code=404, detail="Vault not found")
        
        @app.post("/api/v1/vault/deposit")
        async def deposit_collateral_endpoint(request: dict):
            """Deposit collateral to vault"""
            try:
                vault_address = request["vault_address"]
                amount = float(request["amount"])
                
                logger.info(f"💰 Depositing {amount} SOL to vault {vault_address}")
                
                return {
                    "transaction_signature": "mock_deposit_sig_" + str(datetime.now().timestamp()),
                    "new_collateral": amount,
                    "new_credit_limit": amount * 1.5,
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.post("/api/v1/vault/withdraw")
        async def withdraw_collateral_endpoint(request: dict):
            """Withdraw collateral from vault"""
            try:
                vault_address = request["vault_address"]
                amount = float(request["amount"])
                
                logger.info(f"💸 Withdrawing {amount} SOL from vault {vault_address}")
                
                return {
                    "transaction_signature": "mock_withdraw_sig_" + str(datetime.now().timestamp()),
                    "remaining_collateral": 2.0,
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/api/v1/vault/{vault_address}/health")
        async def get_vault_health_endpoint(vault_address: str):
            """Get vault health status"""
            return {
                "health_factor": 175,
                "status": "healthy",
                "liquidation_risk": "low",
            }
        
        # ===== CARD ENDPOINTS =====
        
        @app.post("/api/v1/card/register")
        async def register_card_v2_endpoint(request: dict):
            """Register NFC card (v2 endpoint matching mobile app)"""
            try:
                card_number = request.get("card_number")
                card_name = request.get("card_name")
                vault_address = request.get("vault_address")
                
                # Hash card number
                card_hash = hashlib.sha256(card_number.encode()).hexdigest()
                
                vault_pubkey = Pubkey.from_string(vault_address)
                await self.register_card(card_hash=card_hash, vault_pubkey=vault_pubkey)
                
                logger.info(f"💳 Card registered: {card_name} → {vault_address}")
                
                return {
                    "success": True,
                    "card_hash": card_hash,
                    "card_name": card_name,
                }
            except Exception as e:
                logger.error(f"❌ Card registration error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/api/v1/card/list")
        async def list_cards_endpoint():
            """List registered cards (mock data)"""
            return [
                {
                    "id": "1",
                    "card_hash": "abc123...",
                    "card_name": "Main Card",
                    "vault_address": "mock_vault_123",
                    "last_4_digits": "1234",
                    "created_at": datetime.now().isoformat(),
                }
            ]
        
        @app.get("/api/v1/card/{card_id}")
        async def get_card_endpoint(card_id: str):
            """Get card details"""
            return {
                "id": card_id,
                "card_hash": "abc123...",
                "card_name": "Main Card",
                "vault_address": "mock_vault_123",
                "last_4_digits": "1234",
                "created_at": datetime.now().isoformat(),
            }
        
        @app.delete("/api/v1/card/{card_id}")
        async def delete_card_endpoint(card_id: str):
            """Delete registered card"""
            logger.info(f"🗑️  Deleting card {card_id}")
            return {"success": True}
        
        # ===== PAYMENT ENDPOINTS =====
        
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
        
        @app.get("/api/v1/payment/status/{tx_id}")
        async def get_payment_status_endpoint(tx_id: str):
            """Get payment transaction status"""
            return {
                "tx_id": tx_id,
                "status": "confirmed",
                "timestamp": datetime.now().isoformat(),
            }
        
        @app.get("/api/v1/transactions")
        async def get_transactions_endpoint(
            wallet: Optional[str] = None,
            limit: int = 20,
            offset: int = 0
        ):
            """Get transaction history"""
            # Mock transaction data
            transactions = [
                {
                    "id": "tx_1",
                    "type": "payment",
                    "amount": 25.50,
                    "merchant": "Coffee Shop",
                    "timestamp": datetime.now().isoformat(),
                    "status": "completed",
                    "privacy_score": 95,
                    "burner_wallet": "mock_burner_123",
                    "decoy_count": 5,
                }
            ]
            return transactions
        
        @app.get("/api/v1/transactions/{tx_id}")
        async def get_transaction_detail_endpoint(tx_id: str):
            """Get transaction details"""
            return {
                "id": tx_id,
                "type": "payment",
                "amount": 25.50,
                "merchant": "Coffee Shop",
                "merchant_wallet": "mock_merchant_wallet",
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "privacy_score": 95,
                "burner_wallet": "mock_burner_123",
                "decoy_count": 5,
                "signature": f"mock_sig_{tx_id}",
            }
        
        @app.post("/api/v1/payment/cancel/{tx_id}")
        async def cancel_payment_endpoint(tx_id: str):
            """Cancel pending payment"""
            logger.info(f"🚫 Cancelling payment {tx_id}")
            return {"success": True, "message": "Payment cancelled"}
        
        # ===== PRIVACY ENDPOINTS =====
        
        @app.get("/api/v1/privacy/score/{tx_id}")
        async def get_privacy_score_endpoint(tx_id: str):
            """Get privacy score for transaction"""
            return {
                "tx_id": tx_id,
                "privacy_score": 95,
                "decoy_count": 5,
                "entropy_source": "ESP32",
            }
        
        # ===== MARKET DATA ENDPOINTS =====
        
        @app.get("/api/v1/market/sol-price")
        async def get_sol_price_endpoint():
            """Get current SOL price in USD"""
            try:
                # In production, fetch from Jupiter or Pyth
                # For now, return approximate price
                return {
                    "price": 150.0,
                    "change24h": 2.4,
                    "timestamp": datetime.now().isoformat(),
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/api/v1/wallet/{wallet_address}/tokens")
        async def get_wallet_tokens_endpoint(wallet_address: str):
            """Get token balances for wallet"""
            try:
                # TODO: Fetch real token balances from Solana
                return [
                    {
                        "symbol": "SOL",
                        "name": "Solana",
                        "balance": 2.5,
                        "usdValue": 375.0,
                        "change24h": 2.4,
                        "mint": "So11111111111111111111111111111111111111112",
                    },
                    {
                        "symbol": "USDC",
                        "name": "USD Coin",
                        "balance": 112.50,
                        "usdValue": 112.50,
                        "change24h": 0.0,
                        "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    },
                ]
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @app.get("/api/v1/wallet/{wallet_address}/nfts")
        async def get_wallet_nfts_endpoint(wallet_address: str):
            """Get NFTs for wallet"""
            try:
                # TODO: Fetch real NFTs from Metaplex or similar
                return []
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
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
    # Load relayer keypair from JSON file or environment
    relayer_keypair_path = os.getenv("RELAYER_KEYPAIR_PATH", "./relayer-keypair.json")
    relayer_secret = os.getenv("RELAYER_SECRET_KEY", "")
    
    # Try loading from JSON file first
    keypair_file = Path(relayer_keypair_path)
    if keypair_file.exists():
        try:
            logger.info(f"🔑 Loading keypair from {keypair_file}")
            with open(keypair_file, 'r') as f:
                keypair_data = json.load(f)
                if isinstance(keypair_data, list):
                    relayer_keypair = Keypair.from_bytes(bytes(keypair_data))
                    logger.info(f"✅ Loaded keypair successfully")
                    logger.info(f"   Public Key: {relayer_keypair.pubkey()}")
                else:
                    raise ValueError("Invalid keypair format - expected array of bytes")
        except Exception as e:
            logger.error(f"❌ Failed to load keypair from {keypair_file}: {e}")
            return
    elif relayer_secret:
        try:
            logger.info(f"🔑 Loading keypair from RELAYER_SECRET_KEY")
            # Validate length before attempting to decode
            if len(relayer_secret) < 64:
                raise ValueError(f"Secret key too short: {len(relayer_secret)} characters (expected 64+)")
            
            relayer_keypair = Keypair.from_base58_string(relayer_secret)
            logger.info(f"✅ Loaded keypair successfully")
            logger.info(f"   Public Key: {relayer_keypair.pubkey()}")
        except Exception as e:
            logger.error(f"❌ Invalid RELAYER_SECRET_KEY format: {e}")
            logger.error("   Expected: base58-encoded secret key (64+ characters)")
            logger.error(f"   Got: {len(relayer_secret)} characters")
            logger.error("")
            logger.error("   Your current RELAYER_SECRET_KEY appears to be a public key.")
            logger.error("   You need the SECRET KEY (base58 string starting with private bytes)")
            return
    else:
        logger.error("❌ No relayer keypair found")
        logger.error("")
        logger.error("  Option 1: Create relayer-keypair.json (RECOMMENDED)")
        logger.error("     solana-keygen new --outfile relayer-keypair.json --no-bip39-passphrase")
        logger.error("")
        logger.error("  Option 2: Set RELAYER_SECRET_KEY in .env")
        logger.error("     RELAYER_SECRET_KEY=your_base58_secret_key_here")
        logger.error("")
        logger.error("  Option 3: Set custom keypair path")
        logger.error("     RELAYER_KEYPAIR_PATH=/path/to/your/keypair.json")
        return
    
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
        privacy_cash_enabled=os.getenv("PRIVACY_CASH_ENABLED", "true").lower() == "true",
    )
    
    # Start API server
    await relayer.start(host="0.0.0.0", port=8080)

if __name__ == "__main__":
    asyncio.run(main())
