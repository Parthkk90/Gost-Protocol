@echo off
REM Privacy Cash Credit Card - Backend Startup Script (Windows)
REM This script starts the payment relayer backend service

echo 🚀 Starting Privacy Cash Backend Services...
echo.

REM Check if we're in the right directory
if not exist "payment_relayer.py" (
    echo ❌ Error: payment_relayer.py not found
    echo Please run this script from the z-cresca-vault\relayer directory
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed
    echo Please install Python 3.10 or higher from python.org
    pause
    exit /b 1
)

REM Check for required Python packages
echo 📦 Checking Python dependencies...
python -c "import anchorpy, solana, solders" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Missing required packages. Installing...
    pip install anchorpy solders solana httpx python-dotenv
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  No .env file found. Creating template...
    (
        echo # Solana Configuration
        echo RPC_URL=https://api.devnet.solana.com
        echo PROGRAM_ID=your_program_id_here
        echo.
        echo # Relayer Wallet ^(base58 encoded^)
        echo RELAYER_PRIVATE_KEY=your_relayer_keypair_here
        echo.
        echo # Privacy Features
        echo PRIVACY_CASH_ENABLED=true
        echo ESP32_ENTROPY_URL=http://esp32.local/entropy
        echo.
        echo # Optional: Database
        echo DATABASE_URL=sqlite:///./privacy_cash.db
    ) > .env
    echo ✅ Created .env template. Please configure it before running.
    pause
    exit /b 1
)

REM Show configuration
echo.
echo 📋 Backend Configuration:
echo ─────────────────────────────────────────────────────────────
type .env | findstr /V "PRIVATE_KEY" | findstr "="
echo ─────────────────────────────────────────────────────────────
echo.

REM Get local IP address for device testing
echo 💡 Your local IP addresses:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do echo    %%a
echo.
echo Update LOCAL_NETWORK_IP in Rypon\src\services\api.ts to one of these IPs
echo for testing on a physical Android device.
echo.

REM Start the backend
echo 🌐 Starting Payment Relayer on http://0.0.0.0:8080
echo 📡 Press Ctrl+C to stop the server
echo.

python payment_relayer.py

pause
