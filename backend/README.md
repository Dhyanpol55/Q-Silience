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

---

## 📊 Measured Benchmark Readings (Live Backend Verified)

Evaluated via `GET /api/benchmark` on Render with stratified synthetic microgrid telemetry ($n=60$, 45 train / 15 test):

| Metric | Classical Baseline (Scikit-Learn SVC) | Genuine Quantum Model (Qiskit ML QSVC) |
| :--- | :--- | :--- |
| **Model Type** | `SVC(kernel="rbf", C=1.0)` | `QSVC(quantum_kernel=FidelityQuantumKernel)` |
| **Feature Map** | Classical Gaussian RBF | Qiskit `ZZFeatureMap` (4 qubits, reps=2, linear) |
| **Backend Environment** | Scikit-Learn 1.5.0 | Qiskit 1.4.6, Qiskit Machine Learning 0.8.2 |
| **Backend Model Status** | `ready` | `genuine_qsvc` (`qml_available=true`) |
| **Test Accuracy** | **100.0%** (15 / 15 correct) | **86.7%** (13 / 15 correct) |
| **Precision** | **1.000** | **0.857** |
| **Recall** | **1.000** | **0.857** |
| **F1-Score** | **1.000** | **0.857** |
| **Training Time (45 samples)** | **3.1 ms** | **27,012.02 ms** (~27.0 seconds) |
| **Inference Time (15 test samples)** | **0.35 ms** | **17,393.71 ms** (~17.4 seconds) |

### Confusion Matrix (Held-Out Test Set, n=15)
- **Classical SVC**: `[[8, 0], [0, 7]]` — TN: 8, FP: 0, FN: 0, TP: 7
- **Genuine QSVC**: `[[7, 1], [1, 6]]` — TN: 7, FP: 1, FN: 1, TP: 6

> **Scientific Disclosure**: The classical SVC baseline outperforms genuine QSVC in both accuracy and latency on this synthetic benchmark. Statevector simulation scales as $O(2^n)$ and evaluates $O(N^2)$ transition fidelities. Zero claims of quantum advantage or sample-efficiency superiority are made.

