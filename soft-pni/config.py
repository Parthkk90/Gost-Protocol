"""
Ghost Protocol Configuration
Testnet settings and API credentials
"""

import os
from enum import Enum


class Network(Enum):
    """Supported blockchain networks"""
    SEPOLIA = "sepolia"
    GOERLI = "goerli"
    MUMBAI = "mumbai"
    BSC_TESTNET = "bsc_testnet"


# Default network for testing
DEFAULT_NETWORK = Network.SEPOLIA

# RPC Endpoints - Configure your own or use public ones
RPC_ENDPOINTS = {
    Network.SEPOLIA: [
        "https://rpc.sepolia.org",
        "https://ethereum-sepolia.publicnode.com",
        "https://rpc2.sepolia.org",
        "https://sepolia.gateway.tenderly.co",
    ],
    Network.GOERLI: [
        "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",  # Public
        "https://ethereum-goerli.publicnode.com",
        "https://goerli.gateway.tenderly.co",
    ],
    Network.MUMBAI: [
        "https://rpc-mumbai.maticvigil.com",
        "https://polygon-mumbai.g.alchemy.com/v2/demo",
    ],
    Network.BSC_TESTNET: [
        "https://data-seed-prebsc-1-s1.binance.org:8545",
        "https://bsc-testnet.publicnode.com",
    ]
}

# Private RPC for real transactions (user should configure)
PRIVATE_RPC_ENDPOINT = os.getenv("GHOST_PRIVATE_RPC", None)

# API Keys (optional - for rate limit increases)
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "YourApiKeyToken")
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY", None)
INFURA_API_KEY = os.getenv("INFURA_API_KEY", None)

# Etherscan API endpoints for different networks
ETHERSCAN_APIS = {
    Network.SEPOLIA: "https://api-sepolia.etherscan.io/api",
    Network.GOERLI: "https://api-goerli.etherscan.io/api",
    Network.MUMBAI: "https://api-testnet.polygonscan.com/api",
}

# DeFi data sources
DEFI_LLAMA_API = "https://api.llama.fi"
COINGECKO_API = "https://api.coingecko.com/api/v3"

# Known popular testnet contracts for each network
KNOWN_CONTRACTS = {
    Network.SEPOLIA: {
        # Uniswap V2 Router
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": "UniswapV2Router",
        # WETH
        "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14": "WETH",
        # USDC (Circle)
        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238": "USDC",
        # Aave V3 Pool
        "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951": "AaveV3Pool",
    },
    Network.GOERLI: {
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D": "UniswapV2Router",
        "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6": "WETH",
    }
}

# Mimicry Engine Settings
MIMICRY_CONFIG = {
    "heartbeat_interval_min": 5,      # seconds
    "heartbeat_interval_max": 45,     # seconds
    "storm_intensity_min": 50,        # decoy count
    "storm_intensity_max": 150,       # decoy count
    "storm_duration_min": 2.0,        # seconds
    "storm_duration_max": 8.0,        # seconds
    "noise_ratio_minimum": 50,        # minimum decoys per real TX
    "contract_cache_ttl": 1800,       # 30 minutes
    "max_contracts_per_category": 20,
}

# Category distribution weights
CATEGORY_WEIGHTS = {
    "defi_exchange": 0.30,
    "defi_lending": 0.20,
    "nft_marketplace": 0.15,
    "bridge": 0.10,
    "governance": 0.10,
    "erc20": 0.15,
}

# Validation settings
VALIDATION_CONFIG = {
    "test_duration": 3600,           # 1 hour
    "observer_sample_rate": 0.1,     # 10% of traffic
    "timing_correlation_threshold": 0.1,
    "false_positive_threshold": 0.05,
    "false_negative_threshold": 0.05,
}


def get_rpc_endpoint(network: Network = DEFAULT_NETWORK) -> str:
    """Get a random public RPC endpoint for the network"""
    import random
    endpoints = RPC_ENDPOINTS.get(network, [])
    if not endpoints:
        raise ValueError(f"No RPC endpoints configured for {network}")
    return random.choice(endpoints)


def get_all_rpc_endpoints(network: Network = DEFAULT_NETWORK) -> list:
    """Get all RPC endpoints for a network"""
    return RPC_ENDPOINTS.get(network, [])


def get_etherscan_api(network: Network = DEFAULT_NETWORK) -> str:
    """Get Etherscan API endpoint for the network"""
    return ETHERSCAN_APIS.get(network, ETHERSCAN_APIS[Network.SEPOLIA])


def get_known_contracts(network: Network = DEFAULT_NETWORK) -> dict:
    """Get known contracts for the network"""
    return KNOWN_CONTRACTS.get(network, {})
