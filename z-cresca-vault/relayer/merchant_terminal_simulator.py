"""
Merchant Terminal Simulator
Simulates a physical POS terminal sending payment requests to the relayer
"""

import asyncio
import httpx
from datetime import datetime
import hashlib

class MerchantTerminal:
    """Simulates a merchant POS terminal"""
    
    def __init__(self, relayer_url: str, merchant_id: str, merchant_wallet: str):
        self.relayer_url = relayer_url
        self.merchant_id = merchant_id
        self.merchant_wallet = merchant_wallet
        self.terminal_id = "TERMINAL_001"
    
    def hash_card(self, card_number: str) -> str:
        """Hash card number for privacy (PCI compliance)"""
        return hashlib.sha256(card_number.encode()).hexdigest()
    
    async def process_card_payment(
        self,
        card_number: str,
        amount_usd: float,
    ) -> dict:
        """
        Process a card payment
        
        Args:
            card_number: Customer's card number (hashed before sending)
            amount_usd: Payment amount in USD
        
        Returns:
            Payment result with approval status
        """
        card_hash = self.hash_card(card_number)
        amount_usdc = int(amount_usd * 1_000_000)  # Convert to USDC lamports
        
        print(f"💳 Swiping card: {card_number[:4]}****{card_number[-4:]}")
        print(f"   Amount: ${amount_usd:.2f}")
        print(f"   Merchant: {self.merchant_id}")
        
        # Send payment request to relayer
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.relayer_url}/api/v1/payment",
                    json={
                        "card_hash": card_hash,
                        "amount_usdc": amount_usdc,
                        "merchant_id": self.merchant_id,
                        "merchant_wallet": self.merchant_wallet,
                        "terminal_id": self.terminal_id,
                        "nonce": str(int(datetime.now().timestamp() * 1000)),
                    },
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ APPROVED")
                    print(f"   Transaction: {result['transaction_signature']}")
                    print(f"   Burner wallet: {result['burner_address']}")
                    return result
                else:
                    error = response.json()
                    print(f"❌ DECLINED: {error.get('detail', 'Unknown error')}")
                    return {"approved": False, "error": error.get("detail")}
                    
            except Exception as e:
                print(f"❌ NETWORK ERROR: {e}")
                return {"approved": False, "error": str(e)}

async def demo():
    """Demo: Merchant processes payments"""
    
    terminal = MerchantTerminal(
        relayer_url="http://localhost:8080",
        merchant_id="STARBUCKS_NYC_001",
        merchant_wallet="9fhQBbGoyTutXw6LdmYVUqRhgCqrQqXqxddJJ8VXoge",  # Valid devnet merchant wallet
    )
    
    print("☕ Starbucks Terminal Starting...")
    print("=" * 60)
    
    # Simulate 3 customer payments
    test_cards = [
        ("4532123456789012", 15.75),  # Coffee
        ("5425233430109903", 8.50),   # Pastry
        ("4532123456789012", 127.99), # Should decline if credit limit reached
    ]
    
    for card_number, amount in test_cards:
        print(f"\n{'-' * 60}")
        await terminal.process_card_payment(card_number, amount)
        await asyncio.sleep(2)
    
    print(f"\n{'=' * 60}")
    print("Demo complete!")

if __name__ == "__main__":
    asyncio.run(demo())
