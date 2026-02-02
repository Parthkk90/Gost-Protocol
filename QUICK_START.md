# Quick Start Guide - Backend + React Native App

## Step 1: Start Backend (Run as Administrator)

```powershell
cd F:\W3\gost_protocol\z-cresca-vault\relayer
.\start_backend.ps1
```

This will:
- ✅ Kill any process using port 8080
- ✅ Add Windows Firewall rules for ports 8080 and 8081
- ✅ Show your PC's IP address
- ✅ Start the backend server

## Step 2: Update App Configuration

1. Check the IP address shown by the backend script (e.g., `172.16.0.2`)

2. Open [Rypon/src/services/api.ts](Rypon/src/services/api.ts)

3. Update line 18:
```typescript
const LOCAL_NETWORK_IP = '172.16.0.2'; // Use IP from backend script
```

## Step 3: Start React Native App

```powershell
cd F:\W3\gost_protocol\Rypon
npx expo start --android --clear
```

## Step 4: Connect Device

**For Physical Device:**
1. Ensure device is on the same WiFi network as your PC
2. Open Expo Go app
3. Scan QR code from terminal

**Test connection from device:**
- Open Chrome browser on your phone
- Navigate to: `http://172.16.0.2:8080/health`
- Should show: `{"status":"ok","timestamp":"..."}`

## Step 5: Reload App

Press `r` in the Metro bundler terminal to reload the app.

**Expected console output:**
```
📱 Android device detected - using network IP: 172.16.0.2:8080
✅ Backend connection successful
```

## Troubleshooting

### "Health check timeout"
1. Check backend is running: `netstat -ano | findstr :8080`
2. Test from PC: `curl http://172.16.0.2:8080/health`
3. Test from device browser: Open `http://172.16.0.2:8080/health`
4. If PC works but device fails → Check firewall

### "Network request failed"  
1. Verify device on same WiFi network
2. Verify LOCAL_NETWORK_IP matches your PC's IP
3. Run backend script as Administrator to add firewall rules

### Backend won't start
1. Kill existing process: 
```powershell
Get-NetTCPConnection -LocalPort 8080 | % { Stop-Process -Id $_.OwningProcess -Force }
```
2. Restart backend

## What Should Work

Once connected:
- ✅ Home screen shows real wallet balance
- ✅ Vault credit limit from Solana smart contract
- ✅ Transaction history from blockchain
- ✅ NFTs and tokens from wallet
- ✅ No mock data - everything is live!

## Current Status

- **Backend**: Solana mainnet (https://api.mainnet-beta.solana.com)
- **Program**: HX5nu29URyVfVFDsiVRumvf64egFydNqgGibBpPxt3nz
- **Privacy SDK**: Enabled
- **Jupiter API**: https://quote-api.jup.ag/v6

---

**Need help?** Check [NETWORK_CONNECTION_FIX.md](Rypon/NETWORK_CONNECTION_FIX.md) for detailed troubleshooting.
