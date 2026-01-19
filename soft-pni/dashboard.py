"""
Ghost Protocol - Web Dashboard
Simple Flask-based monitoring interface
"""

from flask import Flask, render_template, jsonify, request
import threading
import time
import json
from datetime import datetime
from collections import deque
from typing import Dict, List
import psutil
import os

from config import Network, DEFAULT_NETWORK, get_all_rpc_endpoints
from mimicry_engine import MimicryEngine

app = Flask(__name__)

# Global stats storage
class DashboardStats:
    def __init__(self):
        self.total_transactions = 0
        self.total_decoys = 0
        self.storms_triggered = 0
        self.uptime_start = time.time()
        self.recent_activity = deque(maxlen=50)  # Last 50 activities
        self.network = DEFAULT_NETWORK
        self.noise_ratio = 0
        self.rpc_endpoints = []
        self.system_status = "Idle"
        self.last_storm_time = None
        
    def add_activity(self, activity_type: str, details: str):
        """Add activity to recent log"""
        self.recent_activity.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "type": activity_type,
            "details": details
        })
    
    def get_uptime(self) -> str:
        """Get formatted uptime"""
        seconds = int(time.time() - self.uptime_start)
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        return f"{hours}h {minutes}m {secs}s"

stats = DashboardStats()

# Initialize mimicry engine
mimicry_engine = None

@app.route('/')
def index():
    """Home page - Dashboard overview"""
    return render_template('index.html')

@app.route('/activity')
def activity():
    """Activity page - Live transaction feed"""
    return render_template('activity.html')

@app.route('/stats')
def stats_page():
    """Statistics page - Detailed metrics"""
    return render_template('stats.html')

@app.route('/settings')
def settings():
    """Settings page - Configuration"""
    return render_template('settings.html')

@app.route('/api/stats')
def api_stats():
    """API endpoint for real-time stats"""
    return jsonify({
        "total_transactions": stats.total_transactions,
        "total_decoys": stats.total_decoys,
        "storms_triggered": stats.storms_triggered,
        "noise_ratio": f"{stats.noise_ratio}:1",
        "uptime": stats.get_uptime(),
        "network": stats.network.value if hasattr(stats.network, 'value') else str(stats.network),
        "system_status": stats.system_status,
        "last_storm": stats.last_storm_time.strftime("%H:%M:%S") if stats.last_storm_time else "Never",
        "rpc_endpoints": len(stats.rpc_endpoints)
    })

@app.route('/api/activity')
def api_activity():
    """API endpoint for recent activity"""
    return jsonify({
        "activities": list(stats.recent_activity)
    })

@app.route('/api/system')
def api_system():
    """API endpoint for system metrics"""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    
    return jsonify({
        "cpu_usage": f"{cpu_percent}%",
        "memory_usage": f"{memory.percent}%",
        "memory_used": f"{memory.used / (1024**3):.2f} GB",
        "memory_total": f"{memory.total / (1024**3):.2f} GB",
        "disk_usage": f"{psutil.disk_usage('/').percent}%"
    })

@app.route('/api/network')
def api_network():
    """API endpoint for network info"""
    return jsonify({
        "network": stats.network.value if hasattr(stats.network, 'value') else str(stats.network),
        "rpc_endpoints": stats.rpc_endpoints
    })

@app.route('/api/trigger_storm', methods=['POST'])
def api_trigger_storm():
    """API endpoint to manually trigger a test storm"""
    global mimicry_engine
    
    try:
        intensity = request.json.get('intensity', 85) if request.json else 85
        
        stats.add_activity("TEST", f"Manual storm triggered (intensity: {intensity})")
        stats.system_status = "Generating Storm"
        
        # Generate storm
        if mimicry_engine:
            decoys = mimicry_engine.generate_decoy_storm(intensity=intensity)
            stats.total_decoys += len(decoys)
            stats.storms_triggered += 1
            stats.noise_ratio = len(decoys)
            stats.last_storm_time = datetime.now()
            
            stats.add_activity("SUCCESS", f"Storm complete: {len(decoys)} decoys sent")
            stats.system_status = "Idle"
            
            return jsonify({"success": True, "decoys": len(decoys)})
        else:
            return jsonify({"success": False, "error": "Mimicry engine not initialized"})
            
    except Exception as e:
        stats.add_activity("ERROR", f"Storm failed: {str(e)}")
        stats.system_status = "Error"
        return jsonify({"success": False, "error": str(e)})

def init_mimicry_engine(network: Network = DEFAULT_NETWORK):
    """Initialize the mimicry engine"""
    global mimicry_engine, stats
    
    stats.network = network
    stats.rpc_endpoints = get_all_rpc_endpoints(network)
    
    try:
        mimicry_engine = MimicryEngine(network)
        stats.add_activity("SYSTEM", f"Mimicry engine initialized for {network.value}")
        stats.system_status = "Ready"
        return True
    except Exception as e:
        stats.add_activity("ERROR", f"Failed to initialize: {str(e)}")
        stats.system_status = "Error"
        return False

def run_dashboard(host='0.0.0.0', port=5000, network: Network = DEFAULT_NETWORK):
    """Run the dashboard server"""
    print("\n" + "="*60)
    print("Ghost Protocol - Web Dashboard")
    print("="*60)
    print(f"Network: {network.value}")
    print(f"Dashboard URL: http://localhost:{port}")
    print(f"Access from network: http://[Pi-IP]:{port}")
    print("="*60 + "\n")
    
    # Initialize
    init_mimicry_engine(network)
    
    # Start Flask
    app.run(host=host, port=port, debug=False, threaded=True)

if __name__ == "__main__":
    import sys
    
    # Parse arguments
    network = DEFAULT_NETWORK
    port = 5000
    
    if len(sys.argv) > 1:
        try:
            network = Network(sys.argv[1].lower())
        except ValueError:
            print(f"Invalid network. Using default: {DEFAULT_NETWORK.value}")
    
    if len(sys.argv) > 2:
        try:
            port = int(sys.argv[2])
        except:
            print(f"Invalid port. Using default: 5000")
    
    run_dashboard(port=port, network=network)
