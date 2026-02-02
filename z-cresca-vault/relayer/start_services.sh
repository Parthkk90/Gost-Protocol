#!/usr/bin/env bash
# Start Privacy Cash Card Payment System
# This script starts both the Python relayer and Privacy Cash SDK service

set -e

echo "════════════════════════════════════════════════════════"
echo "  🔐 Privacy Cash Card Payment System"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 24+"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo "❌ Node.js 24+ required (found: v$NODE_VERSION)"
    exit 1
fi

echo "✅ Node.js v$(node --version | cut -d'v' -f2)"
echo "✅ Python $(python3 --version | cut -d' ' -f2)"
echo ""

# Install Node.js dependencies
echo "📦 Installing Privacy Cash SDK..."
cd "$(dirname "$0")"
npm install privacycash @solana/web3.js express dotenv 2>/dev/null || true
echo "   ✅ Dependencies ready"
echo ""

# Start Privacy Cash Service in background
echo "🚀 Starting Privacy Cash Service (port 8081)..."
node privacy_cash_service.mjs &
PRIVACY_PID=$!
echo "   PID: $PRIVACY_PID"

# Wait for service to start
sleep 3

# Check if Privacy Cash Service is running
if ! curl -s http://127.0.0.1:8081/health > /dev/null; then
    echo "❌ Privacy Cash Service failed to start"
    kill $PRIVACY_PID 2>/dev/null || true
    exit 1
fi
echo "   ✅ Privacy Cash Service ready"
echo ""

# Start Python Relayer
echo "🚀 Starting Python Payment Relayer (port 8080)..."
python3 payment_relayer.py &
RELAYER_PID=$!
echo "   PID: $RELAYER_PID"
echo ""

# Wait for relayer to start
sleep 3

# Check if relayer is running
if ! curl -s http://127.0.0.1:8080/health > /dev/null; then
    echo "❌ Payment Relayer failed to start"
    kill $PRIVACY_PID $RELAYER_PID 2>/dev/null || true
    exit 1
fi
echo "   ✅ Payment Relayer ready"
echo ""

echo "════════════════════════════════════════════════════════"
echo "  ✅ System Ready!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Services running:"
echo "  • Privacy Cash SDK:    http://127.0.0.1:8081"
echo "  • Payment Relayer:     http://127.0.0.1:8080"
echo ""
echo "API Endpoints:"
echo "  POST /api/v1/payment              - Process card payment"
echo "  POST /api/v1/card/register        - Register NFC card"
echo "  GET  /health                      - Health check"
echo ""
echo "💳 Ready to process private card payments!"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $PRIVACY_PID $RELAYER_PID 2>/dev/null || true
    wait $PRIVACY_PID $RELAYER_PID 2>/dev/null || true
    echo "   ✅ Services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $PRIVACY_PID $RELAYER_PID
