"""
Root Entrypoint for Q-Resilience AI Backend
VTU-Qiskit Fall Fest 2026 — Team Ctrl_AI (VTU-QFF-HC-0025)

Ensures that whether Render or local runs execute from the repository root
or inside the backend/ subfolder, `main:app` and `python main.py` resolve properly.
"""

import os
import sys

# Ensure backend directory is in python sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Expose the FastAPI app from backend.main
from backend.main import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[*] Starting Q-Resilience AI Backend from root entrypoint on {host}:{port}...")
    uvicorn.run("main:app", host=host, port=port, reload=False)
