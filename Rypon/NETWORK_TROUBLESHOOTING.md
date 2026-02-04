# 🔧 Network Connection Troubleshooting Guide

## ❌ Problem: "Network request failed" or "Request timeout"

These errors mean the React Native app cannot reach the backend server.

---

## ✅ Quick Fix Steps

### Step 1: Verify Backend is Running

**Check if backend is running:**
```bash
cd F:\W3\gost_protocol\z-cresca-vault\relayer
python payment_relayer.py
```

**Expected output:**
```
✅ Loaded environment from .env
🌐 Payment Relayer starting...
🚀 API Server running on http://0.0.0.0:8080
```

**⚠️ If you see an error instead:**
- Check if port 8080 is already in use:
  ```bash
  netstat -ano | findstr :8080
  ```
- Kill the process if needed:
  ```bash
  taskkill /PID <pid> /F
  ```

---

### Step 2: Test Backend from Browser

Open a web browser and try:
- http://localhost:8080/health
- http://10.0.2.2:8080/health (Android emulator)

**Should see:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T12:00:00"
}
```

**If you get "This site can't be reached":**
- Backend is not running → Go back to Step 1
- Firewall is blocking → Go to Step 3

---

### Step 3: Check Windows Firewall

**Allow port 8080 through firewall:**

1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter "8080" → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "Privacy Cash Backend" → Finish

**Or disable firewall temporarily (for testing):**
```bash
# In Administrator PowerShell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Re-enable after testing
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

---

### Step 4: Verify App Configuration

**Check which device you're using:**

In Metro bundler terminal, you should see:
- `🤖 Android Emulator detected - using 10.0.2.2:8080`
- `🍎 iOS Simulator detected - using localhost:8080`
- `📱 Physical device - using 192.168.x.x:8080`

**If using physical device:**

1. Find your computer's IP address:
   ```bash
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.3)
   ```

2. Update `Rypon/src/services/api.ts`:
   ```typescript
   const LOCAL_NETWORK_IP = '192.168.1.3'; // Your computer's IP
   ```

3. Ensure both computer and phone are on the **same WiFi network**

---

### Step 5: Restart Everything

Sometimes a clean restart fixes everything:

**Backend:**
```bash
# Stop backend (Ctrl+C)
# Then restart
python payment_relayer.py
```

**React Native App:**
```bash
# Stop Metro bundler (Ctrl+C)
# Clear cache and restart
npx expo start --android -c
```

---

## 🔍 Advanced Diagnostics

### Run Network Diagnostics Test

```bash
cd F:\W3\gost_protocol\z-cresca-vault\relayer
python test_backend_connection.py
```

**All tests should pass:**
```
✅ Health Check.................. PASS
✅ SOL Price..................... PASS
✅ Vault Endpoints............... PASS
✅ Transactions.................. PASS
```

**If tests fail:**
- Backend is not running correctly
- Check backend terminal for error messages

---

### Check Backend Logs

Look for errors in the terminal running `payment_relayer.py`:

**Good logs:**
```
📡 GET /api/v1/vault/xyz → 200
📡 GET /api/v1/transactions → 200
📡 GET /api/v1/market/sol-price → 200
```

**Bad logs:**
```
❌ Error: Connection refused
❌ Error: Program not found
❌ Error: RPC timeout
```

---

### Test from Command Line

**Test health endpoint:**
```bash
curl http://localhost:8080/health
```

**Test vault endpoint:**
```bash
curl http://localhost:8080/api/v1/vault/11111111111111111111111111111111
```

**Test from Android emulator IP:**
```bash
curl http://10.0.2.2:8080/health
```

---

## 📱 Device-Specific Issues

### Android Emulator
- **Must use:** `10.0.2.2:8080` (not `localhost`)
- The app automatically detects emulator and uses correct IP
- If still not working, check firewall (Step 3)

### Android Physical Device
- **Must use:** Your computer's local IP (e.g., `192.168.1.3`)
- Both devices on same WiFi
- Update `LOCAL_NETWORK_IP` in `api.ts`
- Firewall must allow incoming connections

### iOS Simulator
- **Must use:** `localhost:8080` or `127.0.0.1:8080`
- Should work if backend is running
- No firewall issues since it's local

### iOS Physical Device
- **Same as Android physical device**
- Use computer's local IP
- Both on same WiFi
- Update `LOCAL_NETWORK_IP` in `api.ts`

---

## 🚨 Common Mistakes

### ❌ Backend not running
**Solution:** Start backend with `python payment_relayer.py`

### ❌ Wrong IP address
**Solution:** Use `10.0.2.2` for emulator, not `localhost` or `192.168.x.x`

### ❌ Firewall blocking
**Solution:** Allow port 8080 through Windows Firewall

### ❌ Different WiFi networks
**Solution:** Ensure computer and phone are on same WiFi

### ❌ Port already in use
**Solution:** Kill other process using port 8080

### ❌ .env file not configured
**Solution:** Create `.env` in relayer directory with RPC_URL and PROGRAM_ID

---

## ✅ Success Checklist

Before running the app, verify:

- [ ] Backend running on port 8080
- [ ] Health endpoint returns 200 (test in browser)
- [ ] Test script passes all 4 tests
- [ ] Firewall allows port 8080
- [ ] Using correct IP for device type
- [ ] Metro bundler shows correct IP detection
- [ ] No offline banner visible in app

---

## 📞 Still Having Issues?

If nothing works:

1. **Check backend terminal** for error messages
2. **Check Metro bundler** for network logs
3. **Try disabling firewall** temporarily
4. **Restart computer and phone**
5. **Use physical device** instead of emulator (or vice versa)

**Last resort:**
```bash
# Complete clean restart
cd F:\W3\gost_protocol\z-cresca-vault\relayer
python payment_relayer.py

# New terminal
cd F:\W3\gost_protocol\Rypon
npx expo start --android -c --clear
```

---

## 🎯 Expected Behavior

When everything is working correctly:

1. Backend shows requests in terminal:
   ```
   📡 GET /api/v1/vault/xyz → 200
   📡 GET /api/v1/transactions → 200
   ```

2. App shows:
   - ✅ No offline banner
   - ✅ Vault details load
   - ✅ Transactions appear
   - ✅ NFTs/tokens display

3. Console logs show:
   ```
   ✅ Backend connection successful
   📱 Using Expo debugger host: 192.168.1.3
   ```

**That's it! Your app should now connect successfully! 🎉**
