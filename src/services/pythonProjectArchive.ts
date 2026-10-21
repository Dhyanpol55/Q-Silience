export interface PythonFileEntry {
  filename: string;
  path: string;
  description: string;
  content: string;
}

export const PYTHON_PROJECT_FILES: PythonFileEntry[] = [
  {
    filename: 'main.py (FastAPI)',
    path: 'backend/main.py',
    description: 'Render FastAPI production application with quantum & classical inference endpoints',
    content: `"""
FastAPI Backend Application for Q-Resilience AI
Runs on Render (Uvicorn + FastAPI) to provide quantum and classical ML inference endpoints.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import io
import pandas as pd
import numpy as np

import qiskit
from qiskit.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

app = FastAPI(
    title="Q-RESILIENCE AI API",
    description="Quantum-Enhanced Microgrid Anomaly Detection API (VTU Qiskit Fall Fest 2026)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Q-RESILIENCE AI Backend (Render)",
        "qiskit_available": True,
        "qiskit_version": qiskit.__version__,
    }

@app.post("/api/predict")
def predict_telemetry(inputs: SensorInput):
    # Transforms vector to [0, 2pi] and runs both Classical SVC & Quantum QSVC
    ...
`,
  },
  {
    filename: 'requirements.txt (Render)',
    path: 'backend/requirements.txt',
    description: 'Tested dependencies for Render deployment',
    content: `fastapi>=0.115.0
uvicorn[standard]>=0.32.0
qiskit>=1.3.0
qiskit-machine-learning>=0.7.2
qiskit-algorithms>=0.3.0
scikit-learn>=1.5.0
numpy>=1.26.4,<2.1.0
pandas>=2.2.0
pydantic>=2.9.0
joblib>=1.4.0
pytest>=8.3.0
httpx>=0.27.0
`,
  },
  {
    filename: 'render.yaml',
    path: 'backend/render.yaml',
    description: 'Render Blueprint infrastructure-as-code',
    content: `services:
  - type: web
    name: q-resilience-backend
    env: python
    region: oregon
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
`,
  },
  {
    filename: 'quantum_model.py',
    path: 'q-resilience-ai/src/quantum_model.py',
    description: 'Qiskit ZZFeatureMap, FidelityQuantumKernel and QSVC classifier',
    content: `"""
Quantum Machine Learning Engine
Implements genuine Qiskit ZZFeatureMap, FidelityQuantumKernel, and QSVC classifier.
"""

from qiskit.circuit.library import ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from qiskit_machine_learning.algorithms import QSVC

def build_zz_feature_map(num_qubits: int = 4, reps: int = 2, entanglement: str = "linear"):
    return ZZFeatureMap(
        feature_dimension=num_qubits,
        reps=reps,
        entanglement=entanglement,
        insert_barriers=True,
    )

def train_quantum_qsvc(X_train, y_train, num_qubits=4, reps=2, C=1.0):
    feature_map = build_zz_feature_map(num_qubits=num_qubits, reps=reps)
    kernel = FidelityQuantumKernel(feature_map=feature_map)
    qsvc = QSVC(quantum_kernel=kernel, C=C)
    qsvc.fit(X_train, y_train)
    return qsvc
`,
  },
  {
    filename: 'classical_model.py',
    path: 'q-resilience-ai/src/classical_model.py',
    description: 'Scikit-learn SVC (RBF kernel) baseline',
    content: `"""
Classical Machine Learning Baseline Models
Implements Support Vector Classifier (SVC) with RBF kernel and timing.
"""

from sklearn.svm import SVC

def train_classical_svc(X_train, y_train, C=1.0, gamma="scale"):
    model = SVC(C=C, kernel="rbf", gamma=gamma, probability=True, random_state=42)
    model.fit(X_train, y_train)
    return model
`,
  },
  {
    filename: 'test_api.py',
    path: 'backend/tests/test_api.py',
    description: 'FastAPI integration test suite using TestClient and pytest',
    content: `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_prediction_endpoint():
    res = client.post("/api/predict", json={
        "demand_kw": 55.0, "solar_kw": 45.0, "battery_soc_pct": 70.0,
        "voltage_dev_v": 0.2, "frequency_dev_hz": 0.01
    })
    assert res.status_code == 200
    assert "classical_svc" in res.json()
`,
  },
  {
    filename: 'app.py (Streamlit)',
    path: 'q-resilience-ai/app.py',
    description: 'Streamlit multi-page dashboard alternative',
    content: `import streamlit as st
from src.data_generator import generate_microgrid_dataset
from src.preprocessing import prepare_dataset_splits
from src.classical_model import train_classical_svc
from src.quantum_model import train_quantum_qsvc

st.set_page_config(page_title="Q-RESILIENCE AI", page_icon="⚡", layout="wide")
st.title("⚡ Q-RESILIENCE AI — Microgrid Anomaly Detection")
`,
  },
];
