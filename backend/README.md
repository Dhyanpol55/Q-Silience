# Q-Resilience AI — Backend Service
Autonomous Quantum-Enhanced Microgrid Anomaly Detection API built with **FastAPI**, **Qiskit 1.3+**, and **Scikit-learn**.

VTU-Qiskit Fall Fest 2026 — Team Ctrl_AI (VTU-QFF-HC-0025)

---

## 🚀 Quickstart (Local Development)

### 1. Create a Python Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Start the Server
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

---

## 🧪 Running Comprehensive Tests
```bash
pytest -v tests/test_api.py
```
Validates:
1. Health check & probe variations (`/health`, `/health.`, `HEAD /`, `/api/health`)
2. Reproducible dataset generation with seed
3. Sensor input validation & error boundaries
4. Statevector normalization & Hilbert space kernel bounds
5. Kernel Gram matrix symmetry
6. Dual-model prediction (Classical SVC & Quantum QSVC)
7. Confusion matrix shape and ordering
8. Scenarios and Qiskit quantum circuit inspection endpoints
9. Benchmark & evaluate schema conformity

---

## 🌐 Production Architecture & Deployment

- **Python Backend (Render)**:
  - Repository: `https://github.com/Dhyanpol55/Q-Silience`
  - Root Directory: `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Health Check: `/health`
  - CORS: Configured for `https://qresilience.vercel.app` and `https://*.vercel.app`

- **Frontend (Vercel)**:
  - Deployed as a pure React + Vite Single-Page Application (SPA) on Vercel.
  - Connected to Render backend via `VITE_API_BASE_URL`.
