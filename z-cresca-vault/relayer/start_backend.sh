#!/bin/bash

# Privacy Cash Credit Card - Backend Startup Script
# This script starts the payment relayer backend service

echo "🚀 Starting Privacy Cash Backend Services..."
echo ""

# Check if we're in the right directory
if [ ! -f "payment_relayer.py" ]; then
    echo "❌ Error: payment_relayer.py not found"
    echo "Please run this script from the z-cresca-vault/relayer directory"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

# Check for required Python packages
echo "📦 Checking Python dependencies..."
python3 -c "import anchorpy, solana, solders" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  Missing required packages. Installing..."
    pip3 install anchorpy solders solana httpx python-dotenv
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# Solana Configuration
RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=your_program_id_here

# Relayer Wallet (base58 encoded)
RELAYER_PRIVATE_KEY=your_relayer_keypair_here

# Privacy Features
PRIVACY_CASH_ENABLED=true
ESP32_ENTROPY_URL=http://esp32.local/entropy

# Optional: Database
DATABASE_URL=sqlite:///./privacy_cash.db
EOF
    echo "✅ Created .env template. Please configure it before running."
    exit 1
fi

# Show configuration
echo ""
echo "📋 Backend Configuration:"
echo "─────────────────────────────────────────────────────────────"
if [ -f ".env" ]; then
    grep -v "PRIVATE_KEY" .env | grep "=" | while read line; do
        echo "   $line"
    done
fi
echo "─────────────────────────────────────────────────────────────"
echo ""

# Start the backend
echo "🌐 Starting Payment Relayer on http://0.0.0.0:8080"
echo "📡 Press Ctrl+C to stop the server"
echo ""

python3 payment_relayer.py
