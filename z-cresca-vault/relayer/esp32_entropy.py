#!/usr/bin/env python3
"""
ESP32 Physical Entropy Integration
Connects to ESP32 hardware for true random number generation

ESP32 provides hardware-based entropy using:
- ADC noise from floating pins
- Wi-Fi radio noise
- Temperature sensor variations
- Internal TRNG (True Random Number Generator)
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
import httpx
import hashlib
import time

# Load environment
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

ESP32_URL = os.getenv("ESP32_ENTROPY_URL", "http://10.214.161.157/entropy")

class ESP32EntropyProvider:
    """Get hardware entropy from ESP32 physical noise injector"""
    
    def __init__(self, esp32_url: str = ESP32_URL, timeout: float = 5.0):
        self.esp32_url = esp32_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        self.fallback_enabled = True
        
    async def get_hardware_entropy(self, num_bytes: int = 32) -> bytes:
        """Get hardware-generated random bytes from ESP32
        
        Args:
            num_bytes: Number of random bytes to get (default 32 for 256-bit)
            
        Returns:
            Random bytes from ESP32 hardware TRNG
        """
        try:
            # Request entropy from ESP32
            response = await self.client.get(
                self.esp32_url,
                params={"bytes": num_bytes}
            )
            
            if response.status_code == 200:
                data = response.json()
                entropy_hex = data.get("entropy")
                
                if entropy_hex:
                    entropy = bytes.fromhex(entropy_hex)
                    print(f"🎲 ESP32 entropy: {len(entropy)} bytes")
                    print(f"   Source: Hardware TRNG")
                    return entropy
            
            print(f"⚠️  ESP32 returned status {response.status_code}")
            return await self.software_fallback(num_bytes)
            
        except httpx.ConnectError:
            print(f"⚠️  ESP32 not reachable at {self.esp32_url}")
            return await self.software_fallback(num_bytes)
        except Exception as e:
            print(f"⚠️  ESP32 entropy error: {e}")
            return await self.software_fallback(num_bytes)
    
    async def software_fallback(self, num_bytes: int) -> bytes:
        """Software entropy fallback when ESP32 unavailable"""
        if not self.fallback_enabled:
            raise Exception("ESP32 unavailable and fallback disabled")
        
        print(f"🔄 Using software entropy fallback")
        
        # Combine multiple sources for software entropy
        sources = [
            os.urandom(num_bytes),  # OS entropy
            int(time.time() * 1_000_000).to_bytes(8, 'little'),  # Microsecond timestamp
            os.getpid().to_bytes(4, 'little'),  # Process ID
        ]
        
        # Mix sources with SHA256
        combined = b''.join(sources)
        entropy = hashlib.sha256(combined).digest()[:num_bytes]
        
        print(f"   Source: Software PRNG")
        return entropy
    
    async def get_entropy_for_burner(
        self,
        vault: bytes,
        nonce: int,
        mix_with_hardware: bool = True
    ) -> bytes:
        """Get entropy for Privacy Cash burner generation
        
        Mixes deterministic seed (vault + nonce) with hardware entropy
        
        Args:
            vault: Vault pubkey bytes
            nonce: Payment nonce
            mix_with_hardware: Mix with ESP32 entropy for enhanced randomness
            
        Returns:
            32 bytes of entropy for burner keypair
        """
        # Deterministic base (allows recreation if needed)
        base = vault + nonce.to_bytes(8, "little")
        deterministic_seed = hashlib.sha256(base).digest()
        
        if not mix_with_hardware:
            print(f"🔑 Deterministic burner seed only")
            return deterministic_seed
        
        # Get hardware entropy from ESP32
        hardware_entropy = await self.get_hardware_entropy(32)
        
        # Mix deterministic + hardware entropy
        # This gives us reproducibility (deterministic) + unpredictability (hardware)
        mixed = hashlib.sha256(deterministic_seed + hardware_entropy).digest()
        
        print(f"🔐 Enhanced burner seed:")
        print(f"   Deterministic: {deterministic_seed[:8].hex()}...")
        print(f"   Hardware: {hardware_entropy[:8].hex()}...")
        print(f"   Mixed: {mixed[:8].hex()}...")
        
        return mixed
    
    async def test_esp32_connection(self) -> bool:
        """Test if ESP32 is reachable"""
        try:
            response = await self.client.get(self.esp32_url, params={"bytes": 4})
            if response.status_code == 200:
                print(f"✅ ESP32 connected at {self.esp32_url}")
                return True
            else:
                print(f"⚠️  ESP32 returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ ESP32 not reachable: {e}")
            return False
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

async def test_entropy():
    """Test ESP32 entropy generation"""
    print("=" * 60)
    print("🧪 Testing ESP32 Physical Entropy")
    print("=" * 60)
    
    provider = ESP32EntropyProvider()
    
    # Test connection
    print(f"\n📡 Testing ESP32 connection...")
    print(f"   URL: {provider.esp32_url}")
    connected = await provider.test_esp32_connection()
    
    if not connected:
        print(f"\n⚠️  ESP32 not available - will use software fallback")
        print(f"\nTo enable ESP32:")
        print(f"1. Flash ESP32 with entropy firmware")
        print(f"2. Connect to network")
        print(f"3. Update ESP32_ENTROPY_URL in .env")
    
    # Test entropy generation
    print(f"\n🎲 Generating entropy samples...")
    for i in range(3):
        print(f"\nSample {i+1}:")
        entropy = await provider.get_hardware_entropy(32)
        print(f"  Hex: {entropy.hex()}")
        print(f"  Length: {len(entropy)} bytes")
    
    # Test burner entropy
    print(f"\n🔥 Testing burner wallet entropy...")
    from solders.pubkey import Pubkey
    vault = Pubkey.from_string("8xYgbf3DUzs9mRCuVsVvNSb7vr6KMutAjCb7ys8jj57U")
    nonce = int(time.time() * 1000)
    
    burner_entropy = await provider.get_entropy_for_burner(
        bytes(vault),
        nonce,
        mix_with_hardware=True
    )
    
    print(f"\n✅ Burner entropy generated:")
    print(f"   Vault: {vault}")
    print(f"   Nonce: {nonce}")
    print(f"   Entropy: {burner_entropy.hex()}")
    
    await provider.close()
    
    print("\n" + "=" * 60)
    print("✅ Entropy test complete")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_entropy())
