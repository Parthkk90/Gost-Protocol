"""
Ghost Protocol - RPC Proxy
Intercepts wallet traffic and injects decoy transactions into the stream

This proxy sits between a Web3 wallet and the blockchain RPC endpoints.
It detects real transactions and triggers camouflage storms.
"""

import asyncio
import aiohttp
from aiohttp import web
import json
import time
from typing import Dict, Optional
from urllib.parse import urlparse
import websockets
from web3 import Web3

from config import Network, DEFAULT_NETWORK, get_all_rpc_endpoints, PRIVATE_RPC_ENDPOINT
from mimicry_engine import MimicryEngine


class RPCProxy:
    """
    HTTP/WebSocket proxy that intercepts wallet RPC calls
    """
    
    def __init__(self, network: Network = DEFAULT_NETWORK, listen_port: int = 8545):
        self.network = network
        self.listen_port = listen_port
        self.mimicry = MimicryEngine(network)
        self.public_rpcs = get_all_rpc_endpoints(network)
        self.private_rpc = PRIVATE_RPC_ENDPOINT
        
        # Statistics
        self.stats = {
            "total_requests": 0,
            "decoy_requests": 0,
            "real_transactions": 0,
            "storms_triggered": 0,
        }
        
        print(f"[RPCProxy] Initialized on port {listen_port}")
        print(f"[RPCProxy] Network: {network.value}")
        print(f"[RPCProxy] Public RPCs: {len(self.public_rpcs)}")
        print(f"[RPCProxy] Private RPC: {'Configured' if self.private_rpc else '❌ NOT SET'}")
    
    def is_transaction_request(self, method: str) -> bool:
        """Check if RPC method is a transaction broadcast"""
        tx_methods = [
            "eth_sendTransaction",
            "eth_sendRawTransaction",
            "eth_signTransaction",
        ]
        return method in tx_methods
    
    def is_read_request(self, method: str) -> bool:
        """Check if RPC method is a read-only call"""
        read_methods = [
            "eth_call",
            "eth_getBalance",
            "eth_getCode",
            "eth_getStorageAt",
            "eth_blockNumber",
            "eth_getBlockByNumber",
            "eth_getTransactionCount",
            "eth_estimateGas",
        ]
        return method in read_methods
    
    async def forward_request(self, endpoint: str, rpc_request: Dict) -> Dict:
        """Forward RPC request to specified endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint,
                    json=rpc_request,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    return await response.json()
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": rpc_request.get("id", 1),
                "error": {"code": -32603, "message": f"Proxy error: {str(e)}"}
            }
    
    async def trigger_decoy_storm(self, real_tx_data: Dict):
        """
        Launch a decoy storm when a real transaction is detected
        """
        print(f"\n[ALERT] Real transaction detected!")
        print(f"[STORM] Generating camouflage...")
        
        storm_start = time.time()
        self.stats["storms_triggered"] += 1
        
        # Generate decoys
        decoys = self.mimicry.generate_decoy_storm(intensity=75)
        
        # Schedule timeline
        timeline, real_tx_offset = self.mimicry.scheduler.schedule_storm(real_tx_ready=True)
        
        print(f"[STORM] {len(decoys)} decoys | Duration: {max(timeline) if timeline else 0:.2f}s")
        print(f"[STORM] Real TX will be sent at t+{real_tx_offset:.2f}s")
        
        # Execute storm asynchronously
        tasks = []
        real_tx_sent = False
        
        for offset in sorted(timeline):
            # Wait until this offset
            await asyncio.sleep(max(0, offset - (time.time() - storm_start)))
            
            # Check if it's time to send real TX
            if not real_tx_sent and offset >= real_tx_offset:
                # Send real TX to private RPC
                if self.private_rpc:
                    task = self.forward_request(self.private_rpc, real_tx_data)
                else:
                    # Fallback to random public RPC
                    import random
                    task = self.forward_request(random.choice(self.public_rpcs), real_tx_data)
                
                tasks.append(task)
                real_tx_sent = True
                self.stats["real_transactions"] += 1
                print(f"[TX] Real transaction sent via {'private relay' if self.private_rpc else 'public RPC'}")
            else:
                # Send decoy to public RPC
                if decoys:
                    decoy = decoys.pop(0)
                    # Convert decoy to RPC call
                    decoy_request = {
                        "jsonrpc": "2.0",
                        "method": "eth_call",
                        "params": [{
                            "to": decoy.contract_address,
                            "data": Web3.keccak(text=f"{decoy.function_name}()").hex()[:10]
                        }, "latest"],
                        "id": int(time.time() * 1000)
                    }
                    task = self.forward_request(decoy.rpc_endpoint, decoy_request)
                    tasks.append(task)
                    self.stats["decoy_requests"] += 1
        
        # Execute all tasks
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Find real TX response
        real_tx_response = None
        if real_tx_sent:
            real_tx_response = results[timeline.index(real_tx_offset)] if len(results) > 0 else None
        
        storm_duration = time.time() - storm_start
        print(f"[STORM] Complete in {storm_duration:.2f}s")
        print(f"[STORM] Decoys sent: {self.stats['decoy_requests']}")
        
        return real_tx_response
    
    async def handle_rpc_request(self, request: web.Request) -> web.Response:
        """
        Main HTTP handler for RPC requests
        """
        self.stats["total_requests"] += 1
        
        try:
            rpc_request = await request.json()
        except:
            return web.json_response({
                "jsonrpc": "2.0",
                "error": {"code": -32700, "message": "Parse error"}
            })
        
        method = rpc_request.get("method", "")
        
        # Check if this is a transaction
        if self.is_transaction_request(method):
            print(f"\n[INTERCEPT] {method}")
            
            # Trigger storm and send real TX within it
            response = await self.trigger_decoy_storm(rpc_request)
            
            if response:
                return web.json_response(response)
            else:
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": rpc_request.get("id", 1),
                    "error": {"code": -32000, "message": "Transaction failed"}
                })
        
        # For read requests, just forward to a random public RPC
        else:
            import random
            endpoint = random.choice(self.public_rpcs)
            response = await self.forward_request(endpoint, rpc_request)
            return web.json_response(response)
    
    async def handle_health_check(self, request: web.Request) -> web.Response:
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "network": self.network.value,
            "stats": self.stats,
            "private_rpc_configured": bool(self.private_rpc)
        })
    
    def run(self):
        """Start the proxy server"""
        app = web.Application()
        app.router.add_post('/', self.handle_rpc_request)
        app.router.add_get('/health', self.handle_health_check)
        
        print(f"\n{'='*60}")
        print(f"🔒 Ghost Protocol RPC Proxy")
        print(f"{'='*60}")
        print(f"Listening on: http://localhost:{self.listen_port}")
        print(f"Network: {self.network.value}")
        print(f"\nConfigure your wallet to use this RPC endpoint:")
        print(f"  http://localhost:{self.listen_port}")
        print(f"\nAll transactions will be anonymized automatically.")
        print(f"{'='*60}\n")
        
        web.run_app(app, host='127.0.0.1', port=self.listen_port)


async def main():
    import sys
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Parse arguments
    network = DEFAULT_NETWORK
    port = 8545
    
    if len(sys.argv) > 1:
        try:
            network = Network(sys.argv[1].lower())
        except ValueError:
            print(f"Invalid network. Using default: {DEFAULT_NETWORK.value}")
    
    if len(sys.argv) > 2:
        try:
            port = int(sys.argv[2])
        except:
            print(f"Invalid port. Using default: 8545")
    
    # Check for private RPC configuration
    if not PRIVATE_RPC_ENDPOINT:
        print("\n⚠️  WARNING: No private RPC endpoint configured!")
        print("   Real transactions will use public RPCs (less anonymous)")
        print("   Set GHOST_PRIVATE_RPC in .env file\n")
    
    # Create and run proxy
    proxy = RPCProxy(network=network, listen_port=port)
    proxy.run()


if __name__ == "__main__":
    asyncio.run(main())
