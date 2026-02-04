# Backend Connection Fix

## Problem Identified
The backend is running on `0.0.0.0:8080`, but **Windows Firewall is blocking** incoming connections on port 8080.

Test result: `TcpTestSucceeded: False` when connecting to `172.16.0.2:8080`

## Solution

### Step 1: Add Windows Firewall Rule (REQUIRED)

**Run this command in PowerShell as Administrator:**

```powershell
New-NetFirewallRule -DisplayName "Z-Cresca Backend (Port 8080)" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow -Profile Any
```

**Alternative: Use Windows Defender Firewall GUI:**
1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → Next
4. Select "TCP" and enter port `8080` → Next
5. Select "Allow the connection" → Next
6. Check all profiles (Domain, Private, Public) → Next
7. Name it "Z-Cresca Backend" → Finish

### Step 2: Verify Firewall Rule

```powershell
Test-NetConnection -ComputerName 172.16.0.2 -Port 8080
```

You should now see: `TcpTestSucceeded: True` ✅

### Step 3: Restart Your React Native App

The app now includes auto-detection that will:
- Test backend connectivity on startup
- Show clear error messages if connection fails
- Provide troubleshooting hints

## Device-Specific Configuration

### Android Emulator
If using Android Emulator (not physical device), update [api.ts](src/services/api.ts) line 18:

```typescript
const LOCAL_NETWORK_IP = '10.0.2.2'; // Special emulator IP
```

### Physical Android Device
Current configuration (`172.16.0.2`) is correct for physical devices. Just ensure:
1. ✅ Phone and PC on same WiFi network
2. ✅ Windows Firewall rule added (Step 1)
3. ✅ Backend running on `0.0.0.0:8080`

### iOS Simulator
iOS Simulator can use `127.0.0.1` (already configured correctly)

## Verification

### Backend Status
In the terminal running the backend, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
```

### App Console
When you restart the app, you should see:
```
🌐 BACKEND CONNECTION INFO:
========================================
API URL: http://172.16.0.2:8080/api/v1
✅ Backend is REACHABLE: {status: "ok", timestamp: "..."}
```

### If Still Not Working

1. **Check backend is actually running:**
   ```powershell
   cd F:\W3\gost_protocol\z-cresca-vault\relayer
   python payment_relayer.py
   ```

2. **Verify your IP address:**
   ```powershell
   ipconfig | Select-String "IPv4"
   ```
   Use the IP that matches your WiFi adapter

3. **Test from browser on your phone:**
   Open browser on phone and navigate to: `http://172.16.0.2:8080/health`
   Should show: `{"status":"ok","timestamp":"..."}`

4. **Check CloudflareWARP:**
   Your network test shows `InterfaceAlias: CloudflareWARP`. If issues persist, temporarily disable CloudflareWARP VPN and test again.

## Success Indicators

✅ Backend logs show: `INFO:     Uvicorn running on http://0.0.0.0:8080`
✅ Test-NetConnection shows: `TcpTestSucceeded: True`
✅ App console shows: `✅ Backend is REACHABLE`
✅ Health endpoint returns: `{"status":"ok"}`

## Next Steps

Once connection is working, test the app features:
1. Create a vault
2. Register an NFC card
3. Process a payment
