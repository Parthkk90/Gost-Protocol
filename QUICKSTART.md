# Ghost Protocol - Quick Start Guide

## 🚀 Setup (5 minutes)

### 1. Install Dependencies
```powershell
cd f:\W3\gost_protocol\soft-pni
pip install -r requirements.txt
```

### 2. Configure Environment
```powershell
# Copy example environment file
cp .env.example .env

# Edit .env and configure:
# - GHOST_NETWORK=sepolia (or goerli, mumbai)
# - GHOST_PRIVATE_RPC=your_flashbots_url (optional but recommended)
# - ETHERSCAN_API_KEY=your_key (optional, for higher rate limits)
```

## 🧪 Testing the System

### Test 1: Mimicry Engine (Basic Functionality)
```powershell
# Test with Sepolia testnet
python mimicry_engine.py sepolia

# Expected output:
# ✓ 85:1 noise-to-signal ratio
# ✓ Decoys distributed across multiple RPC endpoints
# ✓ Real contracts fetched from blockchain
```

### Test 2: Validation Suite (Anonymization Effectiveness)
```powershell
# Run 60-second validation test
python validator.py 60

# Expected output:
# ✓ TIMING ATTACK RESISTANCE - PASSED
# ✓ IP CLUSTERING RESISTANCE - PASSED  
# ✓ PATTERN DETECTION RESISTANCE - PASSED
```

### Test 3: RPC Proxy (Wallet Integration)
```powershell
# Start the proxy server
python rpc_proxy.py sepolia 8545

# Configure MetaMask:
# 1. Networks → Add Network
# 2. RPC URL: http://localhost:8545
# 3. Chain ID: 11155111 (Sepolia)
# 4. Send a test transaction
#
# The proxy will automatically:
# - Intercept your transaction
# - Generate 50-150 decoy calls
# - Hide your real TX in the storm
# - Route through multiple endpoints
```

## 📊 Validation Results

After running validator.py, you should see:

```
[1] TIMING ATTACK RESISTANCE
  Correlation Coefficient: < 0.1 ✓
  Periodic Pattern: None ✓
  
[2] IP CLUSTERING RESISTANCE  
  Endpoints Used: 4+ ✓
  Distribution Entropy: > 0.7 ✓
  Suspicious Endpoints: 0 ✓

[3] PATTERN DETECTION RESISTANCE
  Detectable Pattern: NO ✓
  False Positive Rate: < 5% ✓

OVERALL: ✓✓✓ ALL TESTS PASSED
```

## 🔍 Understanding the Output

### Mimicry Engine Output
```
[Phase 1] Generating decoy storm...
  → Fetches real contracts from Sepolia
  → Generates 85 decoy calls

[Phase 2] Calculating metrics...
  Noise-to-Signal Ratio: 85.0:1
  → Min 50:1 required, 85:1 is excellent

[Phase 3] Scheduling storm timeline...
  Storm Duration: 4.82s
  → Decoys spread over ~5 seconds

[Phase 4] Sample decoy calls:
  balanceOf() → Contract A via RPC 1
  getAmountsOut() → Contract B via RPC 2
  → Realistic interactions with real contracts

[Phase 5] Injection strategy:
  Real TX Injection: t+3.06s
  → Hidden in the middle of the storm
  Surrounding Decoys: 15 within ±500ms
  → Real TX is indistinguishable
```

## 🛠️ Troubleshooting

### Issue: "No contracts available"
**Solution**: Check internet connection or use different RPC endpoint
```python
# In config.py, add more RPC endpoints:
RPC_ENDPOINTS = {
    Network.SEPOLIA: [
        "https://rpc.sepolia.org",
        "https://ethereum-sepolia.publicnode.com",
        # Add your own Alchemy/Infura endpoint here
    ]
}
```

### Issue: "Private RPC not configured"
**Solution**: Set up Flashbots Protect or similar service
```powershell
# In .env file:
GHOST_PRIVATE_RPC=https://rpc.flashbots.net

# Or use Eden Network:
GHOST_PRIVATE_RPC=https://api.edennetwork.io/v1/rpc
```

### Issue: Validation tests failing
**Solution**: Tune parameters in config.py
```python
MIMICRY_CONFIG = {
    "storm_intensity_min": 70,      # Increase for more decoys
    "storm_intensity_max": 200,     # Higher max intensity
    "noise_ratio_minimum": 60,      # Stricter anonymity
}
```

## 📈 Performance Benchmarks

### Current Phase 1 Results:
- **Decoy Generation**: ~0.5s for 85 decoys
- **Contract Fetching**: ~2-5s (cached for 30 min)
- **Storm Execution**: 2-8s (TRNG randomized)
- **RPC Proxy Latency**: +1-3s per transaction
- **Memory Usage**: ~50MB
- **Network Traffic**: ~50KB per storm

### Phase 2 Target (Hardware):
- **Decoy Generation**: <100ms
- **Storm Execution**: 1-5s
- **Proxy Latency**: +0.5-1s
- **Memory Usage**: <10MB (embedded)
- **24/7 Heartbeat**: Active

## 🎯 Next Steps

### For Developers:
1. Review [SPECIFICATION.md](../docs/SPECIFICATION.md) for architecture details
2. Check [MIMICRY_ENGINE_LOGIC.md](../docs/MIMICRY_ENGINE_LOGIC.md) for algorithms
3. Explore [ROADMAP.md](../ROADMAP.md) for Phase 2 hardware plans

### For Testers:
1. Run validation suite with different networks
2. Test with real wallet transactions on testnet
3. Monitor RPC proxy logs for anomalies
4. Report issues on GitHub

### For Security Researchers:
1. Attempt to de-anonymize test transactions
2. Analyze timing patterns in storm data
3. Test against graph analysis tools
4. Review cryptographic assumptions

## 🔐 Security Notes

### ⚠️ Current Limitations (Phase 1):
- Software-only entropy (not true TRNG)
- No hardware secure element for key storage
- Network-level metadata still visible to ISP
- Requires trust in private RPC provider

### ✅ Mitigated in Phase 2:
- Hardware TRNG for true randomness
- Secure enclave for signing
- Tor/VPN integration for network anonymity
- Decentralized relay network

## 📞 Need Help?

1. Check the [SPECIFICATION.md](../docs/SPECIFICATION.md)
2. Review validator.py output for specific failures
3. Enable debug mode: `GHOST_DEBUG=true` in .env
4. Contact the development team

---

**Status**: Phase 1 Complete ✅  
**Next Milestone**: Hardware Integration (Phase 2)  
**Estimated Timeline**: Q2 2026
