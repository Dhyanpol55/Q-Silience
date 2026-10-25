#!/usr/bin/env python3
"""
Q-RESILIENCE AI — Keep-Alive Pinger (Python)

Sends periodic HTTP GET requests to keep free hosting tiers (Render, Vercel, Railway, etc.)
awake and prevents spin-down cold starts.

Features:
- Uses 100% Python standard library (urllib.request, time, datetime) — ZERO external pip packages!
- Configurable URL & interval via environment variables or CLI arguments
- Detailed timestamped console logging with latency benchmarks
- Handles HTTP errors, network timeouts, and SSL certificates
- Clean exit on Ctrl+C (KeyboardInterrupt)

Usage:
  python3 scripts/keep_alive.py
  python3 scripts/keep_alive.py https://qresilience.vercel.app/ 10
"""

import os
import sys
import time
from datetime import datetime
import urllib.request
import urllib.error

# Configuration
DEFAULT_URL = "https://qresilience.vercel.app/"
DEFAULT_INTERVAL_MIN = 10

TARGET_URL = sys.argv[1] if len(sys.argv) > 1 else os.getenv("TARGET_URL", DEFAULT_URL)
INTERVAL_MINUTES = float(sys.argv[2]) if len(sys.argv) > 2 else float(os.getenv("INTERVAL_MINUTES", DEFAULT_INTERVAL_MIN))
INTERVAL_SECONDS = INTERVAL_MINUTES * 60.0

def get_timestamp() -> str:
    """Returns current UTC timestamp formatted as YYYY-MM-DD HH:MM:SS."""
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

def ping(url: str):
    """Sends a GET request to the target URL and logs the result."""
    print(f"[{get_timestamp()}] [PING] Sending GET request to: {url}")
    t0 = time.time()
    
    headers = {
        "User-Agent": "KeepAlive-PingBot/1.0 (Q-Resilience Free-Tier Pinger; Python urllib)",
        "Accept": "*/*",
    }
    
    req = urllib.request.Request(url, headers=headers, method="GET")
    
    try:
        # Timeout set to 15 seconds
        with urllib.request.urlopen(req, timeout=15) as response:
            latency_ms = round((time.time() - t0) * 1000)
            status_code = response.getcode()
            body_length = len(response.read())
            
            if 200 <= status_code < 400:
                print(f"[{get_timestamp()}] [SUCCESS] HTTP {status_code} OK - {latency_ms}ms ({body_length} bytes received)")
            else:
                print(f"[{get_timestamp()}] [WARNING] HTTP {status_code} - {latency_ms}ms")
                
    except urllib.error.HTTPError as e:
        latency_ms = round((time.time() - t0) * 1000)
        print(f"[{get_timestamp()}] [HTTP ERROR] Server returned HTTP {e.code}: {e.reason} ({latency_ms}ms)")
    except urllib.error.URLError as e:
        latency_ms = round((time.time() - t0) * 1000)
        print(f"[{get_timestamp()}] [NETWORK ERROR] Failed to reach host: {e.reason} ({latency_ms}ms)")
    except Exception as e:
        latency_ms = round((time.time() - t0) * 1000)
        print(f"[{get_timestamp()}] [UNEXPECTED ERROR] {type(e).__name__}: {e} ({latency_ms}ms)")

def main():
    print("=" * 65)
    print("  Q-RESILIENCE AI — BACKEND KEEP-ALIVE DAEMON (PYTHON)")
    print("=" * 65)
    print(f"Target URL : {TARGET_URL}")
    print(f"Interval   : Every {INTERVAL_MINUTES} minutes ({int(INTERVAL_SECONDS)}s)")
    print(f"Python ver : {sys.version.split()[0]}")
    print("Starting monitoring loop... (Press Ctrl+C to stop)\n")
    
    try:
        while True:
            ping(TARGET_URL)
            print(f"[{get_timestamp()}] [SLEEP] Next ping in {INTERVAL_MINUTES} minutes...\n")
            time.sleep(INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print(f"\n[{get_timestamp()}] Interrupted by user (Ctrl+C). Keep-alive daemon stopped.")
        sys.exit(0)

if __name__ == "__main__":
    main()
