"""
Ghost Protocol - Mimicry Engine
Production implementation with real blockchain data integration

This module generates realistic blockchain decoy traffic using live market data.
"""

import random
import time
import asyncio
import aiohttp
import requests
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from config import (
    Network, DEFAULT_NETWORK, get_rpc_endpoint, get_all_rpc_endpoints,
    get_etherscan_api, get_known_contracts, ETHERSCAN_API_KEY,
    MIMICRY_CONFIG, CATEGORY_WEIGHTS, DEFI_LLAMA_API
)


class ContractCategory(Enum):
    """Types of smart contracts for stratified sampling"""
    DEX = "defi_exchange"
    LENDING = "defi_lending"
    NFT = "nft_marketplace"
    BRIDGE = "bridge"
    GOVERNANCE = "governance"
    ERC20 = "random_erc20"


@dataclass
class Contract:
    """Represents a smart contract target for decoy interactions"""
    address: str
    category: ContractCategory
    popularity_score: float  # 0.0 to 1.0
    interaction_count_24h: int
    abi_functions: List[str]


@dataclass
class DecoyCall:
    """A single decoy RPC call"""
    contract_address: str
    function_name: str
    parameters: List[any]
    timestamp: float
    rpc_endpoint: str
    gas_estimate: int


class MarketIntelligence:
    """
    Gathers real-time data from blockchain explorers and DeFi aggregators
    to ensure decoys mimic actual market activity.
    """
    
    def __init__(self, network: Network = DEFAULT_NETWORK):
        self.network = network
        self.contract_cache = []
        self.cache_ttl = MIMICRY_CONFIG["contract_cache_ttl"]
        self.last_refresh = 0
        self.web3 = Web3(Web3.HTTPProvider(get_rpc_endpoint(network)))
        self.etherscan_api = get_etherscan_api(network)
    
    def gather_trending_contracts(self) -> List[Contract]:
        """
        Fetch real contracts from multiple sources:
        - Etherscan top contracts (24h gas usage)
        - Known protocol contracts on testnet
        - Active contracts from recent blocks
        """
        if time.time() - self.last_refresh > self.cache_ttl:
            self._refresh_cache()
        
        return self.contract_cache
    
    def _refresh_cache(self):
        """Fetch real contract data from blockchain"""
        print("[MarketIntelligence] Refreshing contract cache...")
        
        contracts = []
        
        # 1. Get known popular testnet contracts
        known = get_known_contracts(self.network)
        for address, name in known.items():
            category = self._classify_contract(address, name)
            try:
                # Get real transaction count
                tx_count = self._get_contract_tx_count(address)
                contracts.append(Contract(
                    address=address,
                    category=category,
                    popularity_score=0.9,  # Known contracts are highly popular
                    interaction_count_24h=tx_count,
                    abi_functions=self._get_contract_functions(address)
                ))
            except Exception as e:
                print(f"  [Warning] Could not fetch data for {address}: {e}")
        
        # 2. Get top contracts from recent blocks
        try:
            recent_contracts = self._get_active_contracts_from_blocks(limit=20)
            contracts.extend(recent_contracts)
        except Exception as e:
            print(f"  [Warning] Could not fetch recent contracts: {e}")
        
        # 3. Fallback: use known contracts if nothing else works
        if not contracts:
            print("  [Fallback] Using minimal known contracts")
            contracts = self._get_fallback_contracts()
        
        self.contract_cache = contracts
        self.last_refresh = time.time()
        print(f"  [Success] Cached {len(contracts)} contracts")
    
    def _classify_contract(self, address: str, name: str = "") -> ContractCategory:
        """Classify contract based on name and address patterns"""
        name_lower = name.lower()
        if "uniswap" in name_lower or "swap" in name_lower or "dex" in name_lower:
            return ContractCategory.DEX
        elif "aave" in name_lower or "compound" in name_lower or "lend" in name_lower:
            return ContractCategory.LENDING
        elif "nft" in name_lower or "721" in name_lower or "1155" in name_lower:
            return ContractCategory.NFT
        elif "bridge" in name_lower:
            return ContractCategory.BRIDGE
        elif "governor" in name_lower or "vote" in name_lower:
            return ContractCategory.GOVERNANCE
        else:
            return ContractCategory.ERC20
    
    def _get_contract_tx_count(self, address: str) -> int:
        """Get transaction count for a contract from Etherscan"""
        try:
            params = {
                "module": "account",
                "action": "txlist",
                "address": address,
                "startblock": 0,
                "endblock": 99999999,
                "page": 1,
                "offset": 10,
                "sort": "desc",
                "apikey": ETHERSCAN_API_KEY
            }
            response = requests.get(self.etherscan_api, params=params, timeout=10)
            data = response.json()
            if data["status"] == "1":
                return len(data.get("result", []))
        except:
            pass
        return random.randint(100, 5000)  # Estimate if API fails
    
    def _get_contract_functions(self, address: str) -> List[str]:
        """Get public view functions from contract ABI"""
        try:
            # Try to get ABI from Etherscan
            params = {
                "module": "contract",
                "action": "getabi",
                "address": address,
                "apikey": ETHERSCAN_API_KEY
            }
            response = requests.get(self.etherscan_api, params=params, timeout=10)
            data = response.json()
            
            if data["status"] == "1":
                import json
                abi = json.loads(data["result"])
                # Extract view/pure function names
                functions = [
                    item["name"] for item in abi 
                    if item.get("type") == "function" 
                    and item.get("stateMutability") in ["view", "pure"]
                ]
                return functions[:10]  # Limit to 10
        except:
            pass
        
        # Fallback to common ERC20 functions
        return ["balanceOf", "totalSupply", "decimals", "symbol", "name"]
    
    def _get_active_contracts_from_blocks(self, limit: int = 20) -> List[Contract]:
        """Scan recent blocks for active contracts"""
        contracts = []
        try:
            latest_block = self.web3.eth.block_number
            addresses_seen = set()
            
            # Scan last 50 blocks
            for block_num in range(latest_block - 50, latest_block):
                try:
                    block = self.web3.eth.get_block(block_num, full_transactions=True)
                    for tx in block.transactions[:5]:  # Limit per block
                        if tx.to and tx.to not in addresses_seen:
                            # Check if it's a contract
                            code = self.web3.eth.get_code(tx.to)
                            if len(code) > 2:  # Has code = is contract
                                addresses_seen.add(tx.to)
                                contracts.append(Contract(
                                    address=tx.to,
                                    category=ContractCategory.ERC20,  # Default
                                    popularity_score=0.5,
                                    interaction_count_24h=random.randint(50, 500),
                                    abi_functions=self._get_contract_functions(tx.to)
                                ))
                                if len(contracts) >= limit:
                                    return contracts
                except:
                    continue
        except Exception as e:
            print(f"  [Warning] Block scanning failed: {e}")
        
        return contracts
    
    def _get_fallback_contracts(self) -> List[Contract]:
        """Minimal fallback if all data fetching fails"""
        known = get_known_contracts(self.network)
        return [
            Contract(
                address=addr,
                category=ContractCategory.ERC20,
                popularity_score=0.8,
                interaction_count_24h=1000,
                abi_functions=["balanceOf", "totalSupply", "decimals"]
            )
            for addr in list(known.keys())[:5]
        ]


class ContractSelector:
    """
    Implements stratified sampling to choose realistic contract targets
    """
    
    CATEGORY_WEIGHTS = CATEGORY_WEIGHTS
    
    def __init__(self, market_intelligence: MarketIntelligence, network: Network = DEFAULT_NETWORK):
        self.market = market_intelligence
        self.network = network
    
    def select_contracts(self, count: int) -> List[Contract]:
        """
        Select 'count' contracts using stratified sampling with popularity weighting
        """
        available = self.market.gather_trending_contracts()
        selected = []
        
        for category, weight in self.CATEGORY_WEIGHTS.items():
            # Filter contracts by category
            category_contracts = [c for c in available if c.category == category]
            
            if not category_contracts:
                continue
            
            # Number to sample from this category
            sample_size = max(1, int(count * weight))
            
            # Weighted random selection based on popularity
            weights = [c.popularity_score for c in category_contracts]
            samples = random.choices(category_contracts, weights=weights, k=sample_size)
            selected.extend(samples)
        
        # Shuffle to destroy category ordering patterns
        random.shuffle(selected)
        
        return selected[:count]


class InteractionPatternGenerator:
    """
    Generates realistic interaction sequences for each contract type
    """
    
    def generate_calls(self, contract: Contract) -> List[DecoyCall]:
        """
        Create a realistic sequence of RPC calls for this contract
        """
        if contract.category == ContractCategory.DEX:
            return self._generate_dex_calls(contract)
        elif contract.category == ContractCategory.LENDING:
            return self._generate_lending_calls(contract)
        elif contract.category == ContractCategory.NFT:
            return self._generate_nft_calls(contract)
        elif contract.category == ContractCategory.ERC20:
            return self._generate_erc20_calls(contract)
        else:
            return self._generate_generic_calls(contract)
    
    def _generate_dex_calls(self, contract: Contract) -> List[DecoyCall]:
        """Simulate DEX read operations (price queries, reserve checks)"""
        calls = []
        timestamp = time.time()
        
        # Typical DEX interaction: check price before swapping
        calls.append(DecoyCall(
            contract_address=contract.address,
            function_name="getAmountsOut",
            parameters=[1000000, ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"]],
            timestamp=timestamp,
            rpc_endpoint="",  # Set by scheduler
            gas_estimate=50000
        ))
        
        return calls
    
    def _generate_lending_calls(self, contract: Contract) -> List[DecoyCall]:
        """Simulate lending protocol interactions (balance checks, APY queries)"""
        calls = []
        timestamp = time.time()
        
        # Check user account status
        calls.append(DecoyCall(
            contract_address=contract.address,
            function_name="getUserAccountData",
            parameters=[f"0x{random.randbytes(20).hex()}"],  # Random address
            timestamp=timestamp,
            rpc_endpoint="",
            gas_estimate=80000
        ))
        
        return calls
    
    def _generate_nft_calls(self, contract: Contract) -> List[DecoyCall]:
        """Simulate NFT marketplace queries (floor price, listings)"""
        calls = []
        timestamp = time.time()
        
        calls.append(DecoyCall(
            contract_address=contract.address,
            function_name="getCurrentPrice",
            parameters=[random.randint(1, 10000)],  # Random token ID
            timestamp=timestamp,
            rpc_endpoint="",
            gas_estimate=60000
        ))
        
        return calls
    
    def _generate_erc20_calls(self, contract: Contract) -> List[DecoyCall]:
        """Simulate ERC20 token queries (balance, supply, decimals)"""
        calls = []
        timestamp = time.time()
        
        # Most common ERC20 read: balanceOf
        calls.append(DecoyCall(
            contract_address=contract.address,
            function_name="balanceOf",
            parameters=[f"0x{random.randbytes(20).hex()}"],
            timestamp=timestamp,
            rpc_endpoint="",
            gas_estimate=25000
        ))
        
        return calls
    
    def _generate_generic_calls(self, contract: Contract) -> List[DecoyCall]:
        """Fallback for unknown contract types"""
        if not contract.abi_functions:
            return []
        
        func = random.choice(contract.abi_functions)
        return [DecoyCall(
            contract_address=contract.address,
            function_name=func,
            parameters=[],
            timestamp=time.time(),
            rpc_endpoint="",
            gas_estimate=50000
        )]


class DecoyScheduler:
    """
    Determines WHEN to send decoys using true randomization
    """
    
    def __init__(self, network: Network = DEFAULT_NETWORK):
        self.network = network
        self.public_rpcs = get_all_rpc_endpoints(network)
    
    def schedule_heartbeat(self) -> Tuple[int, float]:
        """
        Returns (burst_size, interval_seconds) for background heartbeat
        """
        burst_size = random.randint(1, 5)
        interval = random.uniform(
            MIMICRY_CONFIG["heartbeat_interval_min"],
            MIMICRY_CONFIG["heartbeat_interval_max"]
        )
        return burst_size, interval
    
    def schedule_storm(self, real_tx_ready: bool = False) -> Tuple[List[float], float]:
        """
        Generate a camouflage storm of decoys with timing offsets
        
        Returns (timeline, real_tx_offset)
        """
        if not real_tx_ready:
            return [], 0.0
        
        # Storm parameters from config
        storm_duration = random.uniform(
            MIMICRY_CONFIG["storm_duration_min"],
            MIMICRY_CONFIG["storm_duration_max"]
        )
        storm_intensity = random.randint(
            MIMICRY_CONFIG["storm_intensity_min"],
            MIMICRY_CONFIG["storm_intensity_max"]
        )
        
        # Generate exponentially-distributed timestamps
        timeline = []
        for _ in range(storm_intensity):
            # Exponential distribution creates realistic "burst" effect
            offset = random.expovariate(1.0 / (storm_duration / storm_intensity))
            if offset < storm_duration:
                timeline.append(offset)
        
        timeline.sort()
        
        # Real TX injection point (30-70% through the storm)
        real_tx_offset = random.uniform(0.3 * storm_duration, 0.7 * storm_duration)
        
        print(f"[STORM] Duration: {storm_duration:.2f}s | Decoys: {len(timeline)} | Real TX at: {real_tx_offset:.2f}s")
        
        return timeline, real_tx_offset
    
    def assign_rpc_endpoints(self, decoys: List[DecoyCall]) -> List[DecoyCall]:
        """
        Randomly distribute decoys across multiple public RPC endpoints
        """
        for decoy in decoys:
            decoy.rpc_endpoint = random.choice(self.public_rpcs)
        return decoys


class MimicryEngine:
    """
    Main orchestrator for the decoy generation system
    """
    
    def __init__(self, network: Network = DEFAULT_NETWORK):
        self.network = network
        self.market = MarketIntelligence(network)
        self.selector = ContractSelector(self.market, network)
        self.pattern_gen = InteractionPatternGenerator()
        self.scheduler = DecoyScheduler(network)
        print(f"[MimicryEngine] Initialized for network: {network.value}")
    
    def generate_decoy_storm(self, intensity: int = 80) -> List[DecoyCall]:
        """
        Generate a full storm of decoy calls
        
        Args:
            intensity: Number of decoy calls to generate
        
        Returns:
            List of scheduled decoy calls with timing and routing info
        """
        # Select diverse contracts
        contracts = self.selector.select_contracts(count=intensity // 2)
        
        # Validate we have contracts
        if not contracts:
            print("  [Warning] No contracts available, using fallback data")
            contracts = self.market._get_fallback_contracts()
        
        # Generate interaction patterns
        all_decoys = []
        for contract in contracts:
            calls = self.pattern_gen.generate_calls(contract)
            all_decoys.extend(calls)
        
        # Pad to desired intensity with random selections
        while len(all_decoys) < intensity and contracts:
            contract = random.choice(contracts)
            calls = self.pattern_gen.generate_calls(contract)
            all_decoys.extend(calls)
        
        # Trim excess
        all_decoys = all_decoys[:intensity]
        
        # Assign RPC routing
        all_decoys = self.scheduler.assign_rpc_endpoints(all_decoys)
        
        return all_decoys
    
    def calculate_noise_ratio(self, num_decoys: int, num_real_tx: int = 1) -> float:
        """
        Calculate noise-to-signal ratio
        Minimum viable from config
        """
        return num_decoys / num_real_tx
    
    def is_sufficient_camouflage(self, num_decoys: int) -> bool:
        """Check if decoy count meets minimum threshold"""
        min_ratio = MIMICRY_CONFIG["noise_ratio_minimum"]
        return self.calculate_noise_ratio(num_decoys) >= min_ratio
    
    def execute_storm(self, real_tx_pending: bool = False):
        """
        Simulate executing a decoy storm (for testing)
        """
        print("=" * 60)
        print(f"MIMICRY ENGINE - TESTNET: {self.network.value.upper()}")
        print("=" * 60)
        
        # Generate storm
        print("\n[Phase 1] Generating decoy storm...")
        
        # Generate storm
        decoys = self.generate_decoy_storm(intensity=85)
        
        # Calculate metrics
        noise_ratio = self.calculate_noise_ratio(len(decoys))
        sufficient = self.is_sufficient_camouflage(len(decoys))
        
        print(f"\n[Phase 2] Calculating metrics...")
        print(f"  Decoys Generated: {len(decoys)}")
        print(f"  Noise-to-Signal Ratio: {noise_ratio:.1f}:1")
        print(f"  Minimum Required: {MIMICRY_CONFIG['noise_ratio_minimum']}:1")
        print(f"  Status: {'✓ SUFFICIENT' if sufficient else '✗ INSUFFICIENT'}")
        
        # Schedule timing
        print(f"\n[Phase 3] Scheduling storm timeline...")
        timeline, real_tx_offset = self.scheduler.schedule_storm(real_tx_ready=True)
        
        # Display sample decoys
        print(f"\n[Phase 4] Sample decoy calls:")
        for i, decoy in enumerate(decoys[:5]):
            rpc_host = decoy.rpc_endpoint.replace("https://", "").replace("http://", "")
            print(f"  {i+1}. {decoy.function_name}() → {decoy.contract_address[:10]}... via {rpc_host}")
        
        print(f"\n[Phase 5] Injection strategy:")
        print(f"  Storm Duration: {max(timeline) if timeline else 0:.2f}s")
        print(f"  Real TX Injection: t+{real_tx_offset:.2f}s")
        nearby_decoys = len([t for t in timeline if abs(t - real_tx_offset) < 0.5])
        print(f"  Surrounding Decoys: {nearby_decoys} within ±500ms")
        print(f"  RPC Endpoints Used: {len(set(d.rpc_endpoint for d in decoys))}")
        
        print("\n" + "=" * 60)
        print("✓ Storm generation complete - Ready for validation phase")
        print("=" * 60)


if __name__ == "__main__":
    import sys
    
    # Allow network selection via command line
    network = DEFAULT_NETWORK
    if len(sys.argv) > 1:
        try:
            network = Network(sys.argv[1].lower())
        except ValueError:
            print(f"Invalid network. Using default: {DEFAULT_NETWORK.value}")
    
    # Run simulation
    print("\n🔒 Ghost Protocol - Mimicry Engine")
    print("Testnet Mode: Active\n")
    
    engine = MimicryEngine(network=network)
    engine.execute_storm(real_tx_pending=True)
