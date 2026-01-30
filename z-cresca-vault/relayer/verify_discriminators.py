#!/usr/bin/env python3
"""
Verify that our calculated discriminators match the ones in the IDL
"""

import hashlib
import json
from pathlib import Path

def get_discriminator(ix_name: str) -> bytes:
    """Calculate Anchor instruction discriminator"""
    return hashlib.sha256(f"global:{ix_name}".encode()).digest()[:8]

def bytes_to_array(b: bytes) -> list:
    """Convert bytes to array format"""
    return list(b)

print("=" * 60)
print("🔍 Discriminator Verification")
print("=" * 60)

# Calculate discriminators
init_global = get_discriminator("initialize_global_state")
init_vault = get_discriminator("initialize_vault")
deposit = get_discriminator("deposit_collateral")
authorize = get_discriminator("authorize_payment")

print("\n📊 Calculated Discriminators:")
print(f"   initialize_global_state: {init_global.hex()}")
print(f"   Array format: {bytes_to_array(init_global)}")

print(f"\n   initialize_vault: {init_vault.hex()}")
print(f"   Array format: {bytes_to_array(init_vault)}")

print(f"\n   deposit_collateral: {deposit.hex()}")
print(f"   Array format: {bytes_to_array(deposit)}")

print(f"\n   authorize_payment: {authorize.hex()}")
print(f"   Array format: {bytes_to_array(authorize)}")

# Try to read IDL and compare
idl_path = Path(__file__).parent.parent / "target" / "idl" / "z_cresca_vault.json"
if idl_path.exists():
    print("\n" + "=" * 60)
    print("📋 Comparing with IDL")
    print("=" * 60)
    
    with open(idl_path, 'r') as f:
        idl = json.load(f)
    
    instructions = idl.get("instructions", [])
    
    for ix in instructions:
        name = ix.get("name")
        if name in ["initialize_global_state", "initialize_vault", "deposit_collateral", "authorize_payment"]:
            discriminator = ix.get("discriminator", [])
            calculated = get_discriminator(name)
            calculated_array = bytes_to_array(calculated)
            
            match = "✅" if discriminator == calculated_array else "❌"
            print(f"\n{match} {name}:")
            print(f"   IDL:        {discriminator}")
            print(f"   Calculated: {calculated_array}")
            print(f"   Hex:        {calculated.hex()}")
else:
    print(f"\n⚠️  IDL not found at: {idl_path}")
    print("   Cannot compare with IDL values")

print("\n" + "=" * 60)
print("✅ Verification Complete")
print("=" * 60)
