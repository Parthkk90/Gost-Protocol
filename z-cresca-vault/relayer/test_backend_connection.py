"""
Backend Connection Test Script
Tests if the payment relayer backend is running and accessible
"""

import requests
import sys
import json
from datetime import datetime

BACKEND_URL = "http://localhost:8080/api/v1"
HEALTH_URL = "http://localhost:8080"  # Health endpoint is at root level

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check endpoint...")
    try:
        response = requests.get(f"{HEALTH_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is healthy!")
            print(f"   Status: {data.get('status')}")
            print(f"   Timestamp: {data.get('timestamp')}")
            return True
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection refused. Is the backend running?")
        print("   Run: python payment_relayer.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_sol_price():
    """Test market data endpoint"""
    print("\n🔍 Testing SOL price endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/market/sol-price", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SOL Price: ${data.get('price', 0):.2f}")
            print(f"   24h Change: {data.get('change24h', 0):+.2f}%")
            return True
        else:
            print(f"⚠️  SOL price endpoint returned {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️  Could not fetch SOL price: {e}")
        return False

def test_vault_endpoints():
    """Test vault-related endpoints"""
    print("\n🔍 Testing vault endpoints...")
    
    # Test vault details (expect 404 for non-existent vault)
    test_address = "11111111111111111111111111111111"
    try:
        response = requests.get(f"{BACKEND_URL}/vault/{test_address}", timeout=5)
        if response.status_code == 404:
            print("✅ Vault endpoint responding correctly (404 for non-existent vault)")
            return True
        elif response.status_code == 200:
            print("✅ Vault endpoint working (vault found)")
            return True
        else:
            print(f"⚠️  Vault endpoint returned unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️  Vault endpoint error: {e}")
        return False

def test_transactions():
    """Test transactions endpoint"""
    print("\n🔍 Testing transactions endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/transactions?limit=5", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Transactions endpoint working ({len(data)} transactions)")
            elif isinstance(data, dict) and 'transactions' in data:
                print(f"✅ Transactions endpoint working ({len(data['transactions'])} transactions)")
            return True
        else:
            print(f"⚠️  Transactions endpoint returned {response.status_code}")
            return False
    except Exception as e:
        print(f"⚠️  Transactions endpoint error: {e}")
        return False

def main():
    print("=" * 60)
    print("Privacy Cash Backend Connection Test")
    print("=" * 60)
    print()
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health_check()))
    results.append(("SOL Price", test_sol_price()))
    results.append(("Vault Endpoints", test_vault_endpoints()))
    results.append(("Transactions", test_transactions()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:.<30} {status}")
    
    print("=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Backend is fully operational.")
        print("\n📱 You can now start the React Native app:")
        print("   cd F:\\W3\\gost_protocol\\Rypon")
        print("   npx expo start --android -c")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the backend logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
