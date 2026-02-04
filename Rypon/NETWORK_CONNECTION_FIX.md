# Network Connection Fix Guide

## Current Issue
App shows "Backend connection failed: TypeError: Network request failed" when trying to connect to the backend.

## Root Cause Analysis

### Physical Device vs Emulator
Your device is a **physical Android device** (indicated by LTE signal in screenshot), not an emulator. Physical devices require special network configuration.

### Connection Requirements
1. **Backend Server**: Must be running on `0.0.0.0:8080` (not 127.0.0.1)
2. **Same Network**: Device and PC must be on the same WiFi network
3. **Firewall**: Windows Firewall must allow port 8080
4. **IP Address**: App must use PC's local network IP (not 10.0.2.2 or localhost)

## Step-by-Step Fix

### 1. Verify Backend is Running
```powershell
# Check if backend is running on port 8080
netstat -ano | findstr :8080

# Should show:
# TCP 0.0.0.0:8080 LISTENING PID=xxxxx
```

**Status**: ✅ Backend is running (PID: 24652)

### 2. Get Your PC's Local IP Address
```powershell
# Get local network IP
ipconfig | Select-String "IPv4"

# Or use:
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress
```

Your Expo dev server shows: `10.214.161.161`

### 3. Allow Firewall Access
```powershell
# Add firewall rule for port 8080
netsh advfirewall firewall add rule name="Python Backend 8080" dir=in action=allow protocol=TCP localport=8080

# Or for all Python connections:
netsh advfirewall firewall add rule name="Python" dir=in action=allow program="C:\Program Files\Python312\python.exe"
```

### 4. Verify Device Network
**On your Android device:**
1. Go to **Settings** → **WiFi**
2. Tap on connected network
3. Check IP address (should be `10.214.161.xxx`)
4. Verify gateway is `10.214.161.1`

Both device and PC must be on the same subnet (10.214.161.x).

### 5. Test Backend Accessibility

**From PC:**
```powershell
# Test local access
curl http://localhost:8080/health

# Test network access (use your IP)
curl http://10.214.161.161:8080/health
```

**From Android device:**
```bash
# Using Termux or browser
curl http://10.214.161.161:8080/health

# Or open in Chrome:
http://10.214.161.161:8080/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-02-01T..."}
```

### 6. Update App Configuration

The app is configured to auto-detect your IP from Expo's debugger host. Verify in app logs:

```
🔍 Device Detection:
  Platform: android
  Debugger Host: 10.214.161.161    <-- Should show your IP
  Physical device detected - using Expo host: 10.214.161.161
🌐 API URL: http://10.214.161.161:8080/api/v1
```

If auto-detection fails, manually update `LOCAL_NETWORK_IP` in [src/services/api.ts](src/services/api.ts):
```typescript
const LOCAL_NETWORK_IP = '10.214.161.161'; // Your PC's IP
```

### 7. Reload App
Press `r` in Metro bundler to reload, or shake device → "Reload"

## Verification Checklist

- [x] Backend running on 0.0.0.0:8080 (PID: 24652)
- [ ] Firewall allows port 8080
- [ ] Device on same WiFi as PC (10.214.161.x)
- [ ] Can access http://10.214.161.161:8080/health from device browser
- [ ] App shows correct IP in console logs
- [ ] Health check succeeds in app

## Troubleshooting

### "Network request failed"
- **Cause**: Device cannot reach PC
- **Fix**: Check firewall, verify same WiFi network

### "Request timeout"
- **Cause**: Backend not running or wrong IP
- **Fix**: Verify backend is running, check IP address

### "Connection refused"
- **Cause**: Backend running on 127.0.0.1 instead of 0.0.0.0
- **Fix**: Restart backend with correct binding

### Still Not Working?

1. **Check backend logs** for incoming requests:
   ```
   INFO:     10.214.161.xxx:xxxxx - "GET /health HTTP/1.1" 200 OK
   ```

2. **Enable verbose logging** in app (already enabled)

3. **Test with curl from device** to isolate issue

4. **Temporarily disable firewall** to test:
   ```powershell
   netsh advfirewall set allprofiles state off
   # Test connection
   netsh advfirewall set allprofiles state on
   ```

## Quick Reference

| Environment | Backend URL | Notes |
|-------------|-------------|-------|
| Android Emulator | `http://10.0.2.2:8080` | Special emulator IP |
| iOS Simulator | `http://localhost:8080` | Shares host network |
| Physical Device | `http://10.214.161.161:8080` | Use PC's LAN IP |
| Production | `https://api.yourdomain.com` | Public endpoint |

## Next Steps

Once connection is working:
1. Backend will serve real vault data from Solana mainnet
2. App will display actual credit balance and transactions
3. NFTs and tokens will load from user's wallet
4. All mock data has been removed - everything is live!
