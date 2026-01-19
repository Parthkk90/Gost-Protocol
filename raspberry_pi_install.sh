#!/bin/bash
# Ghost Protocol - Raspberry Pi Quick Setup
# Run this on your Raspberry Pi to install everything

echo "========================================"
echo "Ghost Protocol - Raspberry Pi Setup"
echo "========================================"

# Update system
echo "[Step 1/5] Updating system..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python dependencies
echo "[Step 2/5] Installing Python packages..."
sudo apt-get install -y python3-pip python3-dev python3-venv git

# Install project dependencies
echo "[Step 3/5] Installing Ghost Protocol dependencies..."
cd ~/gost_protocol/soft-pni || exit 1
pip3 install -r requirements.txt

# Create .env if not exists
echo "[Step 4/5] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file - edit it if needed"
fi

# Test installation
echo "[Step 5/5] Testing installation..."
python3 -c "from mimicry_engine import MimicryEngine; print('✓ Mimicry Engine OK')"
python3 -c "import flask; print('✓ Flask OK')"
python3 -c "import psutil; print('✓ Psutil OK')"

echo ""
echo "========================================"
echo "Installation Complete!"
echo "========================================"
echo ""
echo "To start the dashboard:"
echo "  cd ~/gost_protocol/soft-pni"
echo "  python3 dashboard.py"
echo ""
echo "Then visit: http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "To start the RPC proxy:"
echo "  cd ~/gost_protocol/soft-pni"
echo "  python3 rpc_proxy.py"
echo ""
