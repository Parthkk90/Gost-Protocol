# Mimicry Engine Logic Flow

## Overview
The Mimicry Engine generates realistic decoy traffic that appears indistinguishable from legitimate blockchain interactions. It operates continuously to create a baseline of "normal" activity that masks real transactions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MIMICRY ENGINE                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Market      │───▶│  Contract    │───▶│  Decoy       │ │
│  │  Intelligence│    │  Selector    │    │  Generator   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Trending    │    │  Interaction │    │  RPC Call    │ │
│  │  Protocols   │    │  Patterns    │    │  Scheduler   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Logic Flow

### 1. Market Intelligence Module

**Purpose**: Identify what "normal" users are interacting with right now.

```
FUNCTION gather_market_intelligence():
    sources = [
        DeFiLlama.trending_protocols(top=10),
        Etherscan.top_contracts(24h),
        OpenSea.trending_collections(),
        Uniswap.top_pairs_by_volume(),
        Aave.active_markets()
    ]
    
    FOR EACH source IN sources:
        contracts = fetch_active_contracts(source)
        popularity_score = calculate_interaction_volume(contracts)
        
        cache_to_contract_pool(
            contracts,
            weight=popularity_score,
            ttl=30_minutes
        )
    
    RETURN weighted_contract_pool
```

**Key Metrics**:
- Transaction volume (last 24h)
- Unique addresses interacting
- Gas consumption patterns
- Time-of-day distribution

### 2. Contract Selector

**Purpose**: Choose which contracts to interact with based on realism heuristics.

```
FUNCTION select_decoy_contracts(count, diversity_factor):
    contract_pool = get_cached_contract_pool()
    
    // Stratified sampling ensures diversity
    categories = {
        'defi_exchange': 0.30,     // 30% DEX interactions
        'defi_lending': 0.20,      // 20% lending protocols
        'nft_marketplace': 0.15,   // 15% NFT platforms
        'bridge': 0.10,            // 10% cross-chain bridges
        'governance': 0.10,        // 10% DAO voting
        'random_erc20': 0.15       // 15% token queries
    }
    
    selected = []
    FOR EACH category, weight IN categories:
        subset = filter_by_category(contract_pool, category)
        sample_size = floor(count * weight)
        
        // Use TRNG for unpredictable selection
        samples = TRNG.weighted_sample(subset, sample_size)
        selected.append(samples)
    
    // Shuffle to destroy category patterns
    TRNG.shuffle(selected)
    
    RETURN selected
```

**Selection Criteria**:
- **Popularity Weighting**: Favor contracts with high activity (80% probability)
- **Long-tail Sampling**: Occasionally pick obscure contracts (20% probability)
- **Anti-correlation**: Never select contracts user's wallet has interacted with
- **Temporal Alignment**: Match interaction times with typical user patterns (day/night cycles)

### 3. Interaction Pattern Generator

**Purpose**: Define HOW to interact with contracts in a realistic way.

```
FUNCTION generate_interaction_pattern(contract):
    contract_type = classify_contract(contract)
    
    MATCH contract_type:
        CASE 'uniswap_router':
            RETURN [
                call('getAmountsOut', random_token_pair()),
                call('getReserves', random_pair_address()),
                read('WETH')  // Common constant read
            ]
        
        CASE 'erc20_token':
            RETURN [
                call('balanceOf', random_whale_address()),
                call('totalSupply'),
                call('decimals')
            ]
        
        CASE 'aave_pool':
            RETURN [
                call('getUserAccountData', random_active_user()),
                call('getReserveData', random_asset()),
                call('getReservesList')
            ]
        
        CASE 'nft_marketplace':
            RETURN [
                call('getCurrentPrice', random_active_listing()),
                call('getAsk', random_token_id()),
                query_event_logs('Sale', last_100_blocks)
            ]
        
        DEFAULT:
            // Fallback: generic read operations
            RETURN [
                call_random_view_function(),
                read_public_state_variable()
            ]
```

**Realism Factors**:
- **Gas Cost Awareness**: Real users avoid expensive calls - decoys should too
- **Logical Sequences**: Query `getAmountsOut` before swap, not after
- **Failure Tolerance**: Some decoys should intentionally fail (reverted reads are normal)
- **Read-Write Ratio**: 95% reads, 5% state changes (matches typical user behavior)

### 4. Decoy Scheduler

**Purpose**: Determine WHEN to send decoys to create temporal camouflage.

```
FUNCTION schedule_decoy_storm(real_tx_pending):
    
    // Phase 1: Pre-broadcast heartbeat (always running)
    IF NOT real_tx_pending:
        interval = TRNG.range(5_seconds, 45_seconds)
        burst_size = TRNG.range(1, 5)
        
        schedule_burst(
            decoys=generate_decoys(burst_size),
            in=interval
        )
    
    // Phase 2: Camouflage storm (when real TX is ready)
    ELSE:
        storm_duration = TRNG.range(2_seconds, 8_seconds)
        storm_intensity = TRNG.range(50, 120)  // Total decoys
        
        // Exponential ramp-up to mimic urgency
        timeline = []
        FOR i IN range(storm_intensity):
            offset = TRNG.exponential_distribution(
                lambda=storm_duration / storm_intensity
            )
            timeline.append(offset)
        
        // Inject real TX at random point in storm
        real_tx_injection_point = TRNG.range(
            0.3 * storm_duration,  // Not too early
            0.7 * storm_duration   // Not too late
        )
        
        FOR EACH offset IN timeline:
            IF offset >= real_tx_injection_point AND NOT injected:
                inject_real_transaction()
                injected = TRUE
            ELSE:
                send_decoy_to_public_rpc()
        
        // Post-storm cooldown
        schedule_cooldown_decoys(
            count=TRNG.range(10, 25),
            duration=TRNG.range(5, 15_seconds)
        )
```

**Timing Distributions**:
- **Poisson Process**: For heartbeat intervals (mimics random user activity)
- **Exponential Decay**: For storm intensity (mimics user panic/urgency)
- **Uniform Jitter**: ±500ms on all timestamps to prevent clock fingerprinting

### 5. RPC Routing Strategy

**Purpose**: Distribute decoys across multiple endpoints to avoid clustering.

```
FUNCTION route_decoy_call(decoy, is_real_tx):
    
    IF is_real_tx:
        // Real transactions go through private relays
        endpoint = select_private_relay([
            'flashbots_protect',
            'eden_network',
            'bloxroute_private'
        ])
        RETURN endpoint.send(decoy, priority='high')
    
    ELSE:
        // Decoys flood public infrastructure
        public_rpcs = [
            'infura.io',
            'alchemy.com',
            'quicknode.com',
            'publicnode.com',
            'ankr.com'
        ]
        
        // Round-robin with jitter to avoid patterns
        endpoint = TRNG.choice(public_rpcs)
        
        // Rate limit per endpoint to avoid bans
        IF rate_limit_exceeded(endpoint):
            endpoint = fallback_rpc()
        
        RETURN endpoint.send(decoy, priority='low')
```

**Routing Rules**:
- **Never reuse same RPC twice** in a 60-second window for same wallet
- **Randomize User-Agent strings** across decoys
- **Vary TLS fingerprints** if possible (different cipher suites)
- **IP diversity**: Route through VPN/Tor mix if hardware supports it

## Noise-to-Signal Ratio Calculation

**Minimum Viable Camouflage**:

$$
R_{noise} = \frac{N_{decoy}}{N_{real}} \geq 50
$$

Where:
- $N_{decoy}$ = Number of decoy calls in storm
- $N_{real}$ = Number of real transactions (typically 1)

**Optimal Range**: 50–150 decoys per real transaction
- **Too few** (<20): Timing analysis can isolate the outlier
- **Too many** (>200): Anomalous traffic volume triggers firewall rules

## Anti-Fingerprinting Techniques

### Entropy Sources for Unpredictability
1. **TRNG-based timing jitter**: No two storms have the same pattern
2. **Contract rotation**: 30-minute cache refresh ensures fresh targets
3. **Gas price variation**: Decoys use different gas settings than real TX
4. **Nonce gaps**: Hardware maintains multiple nonce sequences to break account linkage

### Evasion Tactics
- **Honeypot avoidance**: Never interact with contracts flagged by static analysis
- **Mimicry limits**: Don't perfectly mimic any single user (avoid ML classification)
- **Behavior drift**: Periodically update interaction patterns to match ecosystem evolution

## Implementation Checkpoints

- [ ] Market intelligence aggregator (fetches trending protocols)
- [ ] Contract classifier (identifies type: DEX, lending, NFT, etc.)
- [ ] Interaction library (realistic call sequences per contract type)
- [ ] TRNG scheduler (temporal distribution of decoys)
- [ ] RPC router (multi-endpoint dispersion)
- [ ] Metrics dashboard (noise-to-signal ratio monitoring)

## Next: Soft-PNI Prototype

The Mimicry Engine logic above needs to be validated in a software prototype before hardware implementation. See [Soft-PNI Implementation](../soft-pni/README.md) for Phase 1 development.
