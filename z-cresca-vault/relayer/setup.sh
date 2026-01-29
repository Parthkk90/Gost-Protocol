#!/bin/bash
# Quick setup script for Z-Cresca relayer

echo "🚀 Z-Cresca Relayer Setup"
echo "=========================="
echo ""

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Generate relayer keypair if not exists
if [ ! -f "./relayer-keypair.json" ]; then
    echo "🔑 Generating new relayer keypair..."
    solana-keygen new --no-bip39-passphrase -o ./relayer-keypair.json
    echo ""
fi

# Get the public key
RELAYER_PUBKEY=$(solana-keygen pubkey ./relayer-keypair.json)
echo "✅ Relayer public key: $RELAYER_PUBKEY"
echo ""

# Airdrop devnet SOL
echo "💰 Requesting devnet SOL airdrop..."
solana airdrop 5 $RELAYER_PUBKEY --url devnet
echo ""

# Get base58 secret key for .env
echo "📝 Extracting secret key for .env file..."
SECRET_KEY=$(cat ./relayer-keypair.json | python3 -c "import sys, json, base58; kp = json.load(sys.stdin); print(base58.b58encode(bytes(kp)).decode())")

# Create .env file
cat > .env << EOF
# Z-Cresca Payment Relayer Configuration
RELAYER_SECRET_KEY=$SECRET_KEY
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=ZCrVau1tYqK7X2MpF9V8Z3mY4hR5wN6sT8dL1pQwR2z
JUPITER_API_URL=https://quote-api.jup.ag/v6
RELAYER_HOST=0.0.0.0
RELAYER_PORT=8080
EOF

echo "✅ .env file created"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Install dependencies: pip install -r requirements.txt"
echo "  2. Start relayer:        python3 payment_relayer.py"
echo "  3. Test with simulator:  python3 merchant_terminal_simulator.py"
echo ""
