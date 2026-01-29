#!/usr/bin/env python3
"""
Convert Solana keypair JSON to base58 secret key for .env file
"""
import json
import sys

try:
    import base58
except ImportError:
    print("Installing base58...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "base58"])
    import base58

def convert_keypair_to_base58(keypair_path):
    with open(keypair_path, 'r') as f:
        keypair_data = json.load(f)
    
    # Convert list of bytes to base58
    secret_bytes = bytes(keypair_data)
    base58_secret = base58.b58encode(secret_bytes).decode('ascii')
    
    return base58_secret

if __name__ == "__main__":
    keypair_path = sys.argv[1] if len(sys.argv) > 1 else "relayer-keypair.json"
    
    try:
        base58_key = convert_keypair_to_base58(keypair_path)
        print(base58_key)
    except FileNotFoundError:
        print(f"Error: {keypair_path} not found", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
