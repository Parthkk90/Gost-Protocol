"""
Quick Backend Connection Test
Tests if backend is accessible from network
"""

import httpx
import asyncio
import socket

def get_local_ip():
    """Get local network IP address"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Connect to external server (doesn't actually send data)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
    finally:
        s.close()
    return local_ip

async def test_backend():
    """Test backend connectivity"""
    local_ip = get_local_ip()
    
    print("=" * 60)
    print("🔍 Z-Cresca Backend Connection Test")
    print("=" * 60)
    print(f"\n📍 Your PC's IP: {local_ip}")
    print(f"📍 Backend should be running on: 0.0.0.0:8080")
    print(f"📱 Devices should connect to: http://{local_ip}:8080\n")
    
    # Test localhost
    print("1️⃣  Testing localhost (127.0.0.1:8080)...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://127.0.0.1:8080/health", timeout=5.0)
            if response.status_code == 200:
                print(f"   ✅ SUCCESS: {response.json()}")
            else:
                print(f"   ❌ FAILED: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test local network IP
    print(f"\n2️⃣  Testing local network ({local_ip}:8080)...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://{local_ip}:8080/health", timeout=5.0)
            if response.status_code == 200:
                print(f"   ✅ SUCCESS: {response.json()}")
                print(f"\n   🎉 Backend is accessible from network!")
                print(f"   📱 Use this URL in your app: http://{local_ip}:8080")
            else:
                print(f"   ❌ FAILED: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
        print(f"\n   ⚠️  Backend not accessible from network!")
        print(f"   💡 Possible issues:")
        print(f"      - Backend not running on 0.0.0.0 (check if using 127.0.0.1)")
        print(f"      - Windows Firewall blocking port 8080")
        print(f"      - Antivirus blocking connections")
    
    # Test 0.0.0.0 binding
    print(f"\n3️⃣  Testing 0.0.0.0 binding...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://0.0.0.0:8080/health", timeout=5.0)
            if response.status_code == 200:
                print(f"   ✅ Backend bound to 0.0.0.0")
            else:
                print(f"   ⚠️  Unusual response: {response.status_code}")
    except Exception as e:
        print(f"   ℹ️  0.0.0.0 test (this may fail on Windows, it's normal)")
    
    print("\n" + "=" * 60)
    print("📋 Connection Summary")
    print("=" * 60)
    print(f"Backend URL for your app: http://{local_ip}:8080")
    print(f"\n📝 Next Steps:")
    print(f"1. Update LOCAL_NETWORK_IP in Rypon/src/services/api.ts if needed")
    print(f"2. Make sure your device is on the same WiFi network")
    print(f"3. Allow port 8080 through Windows Firewall:")
    print(f"   netsh advfirewall firewall add rule name=\"Backend 8080\" dir=in action=allow protocol=TCP localport=8080")
    print(f"4. Test from device browser: http://{local_ip}:8080/health")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_backend())
