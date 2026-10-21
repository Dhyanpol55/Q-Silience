# Q-Resilience AI — Backend Service

Autonomous Quantum-Enhanced Microgrid Anomaly Detection API built with **FastAPI**, **Qiskit**, and **Scikit-learn**.

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
The API documentation is available interactively at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

---

## 🧪 Running Tests
```bash
pytest
```

---

## 🐳 Docker Deployment
```bash
docker build -t q-resilience-backend .
docker run -p 8000:8000 q-resilience-backend
```

---

## 🌐 Cloud Deployment (Render & Vercel)
- **Render**: Connect repository or root directory `backend`, start command: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Vercel**: Configured in root `vercel.json` under `services.backend` with `root: "backend"` and `entrypoint: "main.py"`.
