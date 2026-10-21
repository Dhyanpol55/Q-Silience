"""
API endpoint tests for FastAPI backend
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_get_dataset():
    response = client.get("/api/dataset?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) <= 10
    assert "demand_kw" in data["samples"][0]

def test_prediction_endpoint():
    payload = {
        "demand_kw": 55.0,
        "solar_kw": 45.0,
        "battery_soc_pct": 70.0,
        "voltage_dev_v": 0.2,
        "frequency_dev_hz": 0.01,
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "classical_svc" in data
    assert data["classical_svc"]["prediction"] in ["NORMAL", "ABNORMAL"]
    assert "heuristic_diagnosis" in data

def test_benchmark_endpoint():
    response = client.get("/api/benchmark")
    assert response.status_code == 200
    data = response.json()
    assert "classical_svc" in data
    assert "accuracy" in data["classical_svc"]
    assert "confusion_matrix" in data["classical_svc"]
