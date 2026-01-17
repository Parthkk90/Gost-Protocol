# Soft-PNI: Software Prototype

## Overview
This directory contains the **Phase 1** software-only implementation of the Ghost Protocol's Physical Noise Injector (PNI). The goal is to validate the Mimicry Engine's effectiveness before moving to hardware.

## Components

### 1. `mimicry_engine.py`
Core logic for generating realistic blockchain decoy traffic:
- **MarketIntelligence**: Tracks trending protocols and contracts
- **ContractSelector**: Stratified sampling of interaction targets
- **InteractionPatternGenerator**: Creates realistic call sequences
- **DecoyScheduler**: Temporal distribution and RPC routing
- **MimicryEngine**: Main orchestrator

### 2. `validator.py` (coming next)
Validation framework to test if observers can distinguish decoys from real traffic:
- Etherscan API observer simulation
- Timing correlation analysis
- IP clustering detection
- Graph analysis resistance testing

### 3. `rpc_proxy.py` (coming next)
Local proxy that intercepts wallet traffic and injects decoys:
- HTTP/WebSocket proxy for wallet connections
- Real TX detection and buffering
- Storm triggering on transaction detection

## Running the Prototype

```powershell
# Install dependencies
pip install web3 requests aiohttp

# Run mimicry engine test
python mimicry_engine.py

# Run full validation suite (once implemented)
python validator.py --duration 3600 --intensity 80
```

## Validation Goals

The Soft-PNI must demonstrate:

1. **Undetectable Decoys**: External observers (Etherscan, Tenderly) cannot distinguish between:
   - Real user queries vs decoy reads
   - Real transaction broadcasts vs injected noise

2. **Timing Obfuscation**: No correlation between:
   - Wallet software launch time ↔ First transaction broadcast
   - User "Send" button click ↔ Mempool appearance

3. **Graph Resistance**: Address clustering algorithms cannot link:
   - Multiple transactions from same wallet
   - Wallet interactions with specific contract patterns

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Noise-to-Signal Ratio | ≥ 50:1 | Count decoy vs real calls |
| Timing Correlation | ρ < 0.1 | Pearson correlation of TX times |
| False Positive Rate | < 5% | Observer misclassifies real TX as decoy |
| False Negative Rate | < 5% | Observer misclassifies decoy as real |

## Next Steps

After validation:
1. Port to ESP32/STM32 firmware
2. Integrate hardware TRNG for true randomness
3. Build PNI-Link protocol for wallet communication
4. Test with real wallet software (MetaMask, etc.)
