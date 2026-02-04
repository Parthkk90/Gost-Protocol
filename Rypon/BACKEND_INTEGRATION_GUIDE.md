# Backend Integration Guide - Privacy Cash Credit Card

## 🚀 Quick Start - Running the Full System

### Prerequisites
1. ✅ Solana CLI installed
2. ✅ Python 3.10+ with required packages
3. ✅ Node.js 18+ for React Native
4. ✅ Android device/emulator or physical device

---

## 📡 Starting the Backend Services

### 1. Start the Payment Relayer (Backend API - Port 8080)

```bash
# Navigate to the relayer directory
cd F:\W3\gost_protocol\z-cresca-vault\relayer

# Activate virtual environment (if you have one)
# .\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Start the payment relayer
python payment_relayer.py
```

**Expected Output:**
```
✅ Loaded environment from .env
🌐 Payment Relayer starting...
🔗 RPC URL: https://api.devnet.solana.com
📍 Program ID: YourProgramIdHere
🔑 Relayer: YourRelayerPubkeyHere
🚀 API Server running on http://0.0.0.0:8080
```

**Available Endpoints:**
- `GET /api/v1/health` - Health check
- `POST /api/v1/vault/create` - Create new vault
- `GET /api/v1/vault/{address}` - Get vault details
- `POST /api/v1/vault/deposit` - Deposit collateral
- `POST /api/v1/payment` - Process payment
- `GET /api/v1/transactions` - Get transaction history
- `POST /api/v1/register_card` - Register NFC card

---

### 2. Configure Network Settings

The React Native app automatically detects your device type and connects to the backend:

**For Android Emulator:**
- Uses `10.0.2.2:8080` (special IP that routes to host machine)

**For Physical Android Device:**
- Update `LOCAL_NETWORK_IP` in `src/services/api.ts`
- Find your computer's IP address:
  ```bash
  # Windows
  ipconfig
  # Look for "IPv4 Address" under your active network adapter
  
  # Mac/Linux
  ifconfig | grep inet
  ```
- Example: `const LOCAL_NETWORK_IP = '192.168.1.3';`

**For iOS Simulator:**
- Uses `127.0.0.1:8080` (localhost)

**For Physical iOS Device:**
- Same as Android - update `LOCAL_NETWORK_IP` to your computer's IP

---

## 🔧 Backend Service Configuration

### Environment Variables (.env)

Create a `.env` file in `z-cresca-vault/relayer/`:

```env
# Solana Configuration
RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=your_program_id_here

# Relayer Wallet
RELAYER_PRIVATE_KEY=your_relayer_keypair_base58

# Optional: Privacy Features
PRIVACY_CASH_ENABLED=true
ESP32_ENTROPY_URL=http://esp32.local/entropy

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost/privacy_cash
```

---

## 📱 Starting the React Native App

```bash
# Navigate to the Rypon app directory
cd F:\W3\gost_protocol\Rypon

# Install dependencies (first time only)
npm install

# Start Expo dev server
npx expo start --android -c

# Or for iOS
npx expo start --ios -c

# Or scan QR code with Expo Go app on your phone
```

---

## ✅ Testing Backend Connection

### 1. Check Backend Health

Open a browser or use curl:
```bash
curl http://localhost:8080/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-01T12:00:00Z",
  "services": {
    "solana_rpc": "connected",
    "program": "loaded",
    "database": "connected"
  }
}
```

### 2. Test from React Native App

The app will automatically display connection status:
- 🟢 **Connected** - Backend is running and reachable
- 🔴 **Offline** - Backend is not running or unreachable

---

## 🔐 Smart Contract Integration

### Vault Operations

**Create Vault:**
```typescript
// In React Native app
const result = await vaultService.createVault({
  owner_pubkey: wallet.publicKey,
  vault_id: 1,
  default_ltv: 15000, // 150%
  base_interest_rate: 500, // 5%
});
```

**Backend processes this and:**
1. Derives vault PDA (Program Derived Address)
2. Calls `initialize_vault` instruction on Solana program
3. Returns transaction signature
4. Updates vault state on-chain

**Get Vault Details:**
```typescript
// Fetches from on-chain via backend
const vaultDetails = await vaultService.getVaultDetails(vaultAddress);

// Returns:
{
  collateral_amount: 1500000000,  // 1.5 SOL in lamports
  credit_limit: 225000000,        // $225 in micro-USDC
  outstanding_balance: 0,
  health_factor: 185,             // 185%
  available_credit: 225000000
}
```

### Payment Flow

**1. User Taps Card at Merchant**
```
Physical NFC Card → Merchant Terminal → Backend Relayer
```

**2. Backend Processing:**
```python
# payment_relayer.py
async def process_payment(request: PaymentRequest):
    # 1. Look up vault by card hash
    vault = await find_vault_by_card_hash(request.card_hash)
    
    # 2. Create burner wallet for privacy
    burner = await create_burner_wallet(entropy_source)
    
    # 3. Call authorize_payment on-chain
    tx = await program.rpc["authorize_payment"](
        amount=request.amount_usdc,
        ctx=Context(
            accounts={
                "vault": vault.address,
                "burner": burner.pubkey(),
                "merchant": request.merchant_wallet,
                ...
            }
        )
    )
    
    # 4. Execute payment if approved
    if tx.approved:
        await execute_payment(vault, burner, merchant, amount)
    
    return PaymentResponse(...)
```

**3. React Native App Updates:**
```typescript
// App polls for transaction status
const status = await paymentService.getStatus(txId);
// Shows progress: Creating burner → Authorizing → Executing → Complete
```

---

## 🗄️ Data Flow

### Real-time Updates

**Wallet Balance:**
```
Solana Blockchain → Backend RPC → React Native App
Every screen refresh or pull-to-refresh
```

**Transaction History:**
```
On-chain transaction logs → Backend indexer → API response → Activity screen
Filtered by user's vault address
```

**Vault Health:**
```
Smart contract state → Backend calculation → HomeScreen display
Updated every time vault details are fetched
```

### No Mock Data Policy

All screens now fetch real data:
- ✅ **HomeScreen** - Live vault details and transactions from backend
- ✅ **ActivityScreen** - Real transaction history from blockchain
- ✅ **CollectiblesScreen** - Live NFT and token data from Solana
- ✅ **VaultManagement** - Real-time collateral and credit calculations

If backend is unavailable:
- Shows loading state during connection attempts
- Displays empty state with retry option
- No fake/sample data is shown

---

## 🐛 Troubleshooting

### Backend Not Starting

**Error:** `Connection refused on port 8080`
- Check if another process is using port 8080
- Windows: `netstat -ano | findstr :8080`
- Kill process: `taskkill /PID <pid> /F`

**Error:** `Module not found: anchorpy`
```bash
pip install anchorpy solders solana httpx python-dotenv
```

**Error:** `No module named 'esp32_entropy'`
- This is optional (privacy enhancement)
- Relayer will use software fallback automatically

### App Can't Connect to Backend

**For Android Emulator:**
1. Ensure backend is running on port 8080
2. Try `http://10.0.2.2:8080` instead of `localhost`
3. Check firewall isn't blocking port 8080

**For Physical Device:**
1. Both device and computer must be on same WiFi network
2. Update `LOCAL_NETWORK_IP` in `src/services/api.ts`
3. Check your computer's firewall allows incoming connections on port 8080
4. Windows Firewall: Add inbound rule for port 8080

**For iOS:**
1. iOS simulators use `localhost:8080`
2. Physical devices need your computer's local IP
3. Expo must be running in same network

### Smart Contract Errors

**Error:** `Program account not found`
- Ensure program is deployed to correct network (devnet/mainnet)
- Check `PROGRAM_ID` in `.env` matches deployed program

**Error:** `Insufficient funds`
- Vault doesn't have enough collateral
- Deposit more SOL via `DepositCollateralScreen`

**Error:** `Account not initialized`
- Vault hasn't been created yet
- Use `CreateVaultScreen` to initialize vault

---

## 🎯 Testing Checklist

Before deploying to production:

### Backend Health
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200
- [ ] Can create vault via API
- [ ] Can process payment via API

### Smart Contract
- [ ] Program deployed and verified
- [ ] Vault initialization works
- [ ] Payment authorization works
- [ ] Collateral deposits work

### React Native App
- [ ] App connects to backend
- [ ] Wallet creation/import works
- [ ] Vault creation succeeds
- [ ] NFT/token balances load
- [ ] Transaction history displays
- [ ] Payment processing completes

---

## 📚 Additional Resources

- **Smart Contract Code:** `f:\W3\gost_protocol\solana-program\`
- **Backend API:** `f:\W3\gost_protocol\z-cresca-vault\relayer\`
- **React Native App:** `f:\W3\gost_protocol\Rypon\`
- **API Documentation:** See `payment_relayer.py` for endpoint details
- **Solana Documentation:** https://docs.solana.com/
- **Anchor Framework:** https://www.anchor-lang.com/

---

## 🚀 Production Deployment

When ready to deploy:

1. **Deploy Smart Contract to Mainnet:**
   ```bash
   anchor build
   anchor deploy --provider.cluster mainnet
   ```

2. **Update Backend Configuration:**
   ```env
   RPC_URL=https://api.mainnet-beta.solana.com
   PROGRAM_ID=<mainnet_program_id>
   ```

3. **Configure Production API URL:**
   - Update `api.ts` to use production backend URL
   - Example: `https://api.privacycash.com`

4. **Build Production App:**
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

---

**Need Help?** Check console logs in:
- Backend: Terminal running `payment_relayer.py`
- React Native: Metro bundler terminal
- Device: `npx react-native log-android` or `npx react-native log-ios`
