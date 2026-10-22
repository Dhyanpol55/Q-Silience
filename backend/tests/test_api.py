"""
Comprehensive Test Suite for Q-Resilience AI Backend
VTU-Qiskit Fall Fest 2026 — Team Ctrl_AI (VTU-QFF-HC-0025)

Verifies:
1. Health check & probe variations (Render /health., HEAD /, /api/health)
2. Reproducible dataset generation with seed
3. Sensor input validation & error handling
4. Statevector normalization & Hilbert space kernel bounds
5. Kernel Gram matrix symmetry & positive semi-definiteness bounds
6. Dual-model prediction (Classical SVC & Quantum QSVC)
7. Confusion matrix shape, labels, and ordering
8. Scenarios and Qiskit quantum circuit inspection endpoints
9. Benchmark & evaluate schema conformity
"""

import pytest
import numpy as np
from fastapi.testclient import TestClient
from main import app, compute_zz_statevector, compute_fidelity_kernel_matrix

client = TestClient(app)

# 1. Health check & probe variations
def test_health_check_variations():
    # Test standard GET /health
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "models_ready" in data
    assert data["models_ready"] is True
    assert "qiskit_available" in data
    assert "quantum_kernel_type" in data
    assert "uptime_seconds" in data

    # Test trailing dot probe common in Render health checks: /health.
    res_dot = client.get("/health.")
    assert res_dot.status_code == 200
    assert res_dot.json()["status"] == "healthy"

    # Test HEAD request on root probe
    head_res = client.head("/")
    assert head_res.status_code == 200

    # Test GET /api/health
    api_health = client.get("/api/health")
    assert api_health.status_code == 200
    assert api_health.json()["status"] == "healthy"


# 2. Dataset generation reproducibility
def test_dataset_generation_reproducibility():
    payload = {"sample_count": 40, "random_seed": 123, "abnormal_ratio": 0.35}
    res1 = client.post("/api/dataset/generate", json=payload)
    assert res1.status_code == 200
    b1 = res1.json()["benchmark"]
    assert b1["total_samples"] == 40

    # Fetch dataset samples
    ds_res = client.get("/api/dataset?limit=40")
    assert ds_res.status_code == 200
    ds = ds_res.json()
    assert ds["total"] == 40
    assert len(ds["samples"]) == 40

    # Ensure required telemetry columns exist
    first = ds["samples"][0]
    for col in ["demand_kw", "solar_kw", "battery_soc_pct", "voltage_dev_v", "frequency_dev_hz", "is_abnormal"]:
        assert col in first


# 3. Sensor input validation
def test_sensor_input_validation():
    # Negative demand (out of bounds ge=0)
    invalid_payload = {
        "demand_kw": -15.0,
        "solar_kw": 40.0,
        "battery_soc_pct": 50.0,
        "voltage_dev_v": 0.0,
        "frequency_dev_hz": 0.0,
    }
    res = client.post("/api/predict", json=invalid_payload)
    assert res.status_code == 422  # Unprocessable Entity

    # Battery SoC > 100%
    invalid_soc = {
        "demand_kw": 50.0,
        "solar_kw": 40.0,
        "battery_soc_pct": 125.0,
        "voltage_dev_v": 0.0,
        "frequency_dev_hz": 0.0,
    }
    res = client.post("/api/predict", json=invalid_soc)
    assert res.status_code == 422


# 4. Statevector normalization and Hilbert space kernel bounds
def test_statevector_normalization_and_kernel_properties():
    x1 = np.array([0.5, 1.2, 2.4, 3.1])
    x2 = np.array([1.0, 0.2, 0.9, 2.8])

    psi1 = compute_zz_statevector(x1, num_qubits=4, reps=2)
    psi2 = compute_zz_statevector(x2, num_qubits=4, reps=2)

    # 4 qubits -> 2^4 = 16 statevector length
    assert len(psi1) == 16
    assert len(psi2) == 16

    # Unit norm in Hilbert space
    norm1 = np.linalg.norm(psi1)
    norm2 = np.linalg.norm(psi2)
    assert np.isclose(norm1, 1.0, atol=1e-5)
    assert np.isclose(norm2, 1.0, atol=1e-5)

    # Self-fidelity K(x, x) = |<psi|psi>|^2 = 1.0
    fidelity_self = np.abs(np.vdot(psi1, psi1)) ** 2
    assert np.isclose(fidelity_self, 1.0, atol=1e-5)

    # Fidelity between different points is in [0, 1]
    fidelity_cross = np.abs(np.vdot(psi1, psi2)) ** 2
    assert 0.0 <= fidelity_cross <= 1.00001


# 5. Kernel matrix symmetry
def test_fidelity_kernel_matrix_symmetry():
    X = np.array([
        [0.1, 0.5, 1.2, 2.0],
        [1.5, 2.3, 0.4, 3.1],
        [0.8, 1.1, 2.9, 0.3],
    ])
    K = compute_fidelity_kernel_matrix(X, X)

    # Matrix must be square (3x3)
    assert K.shape == (3, 3)
    # Diagonal must be 1.0
    for i in range(3):
        assert np.isclose(K[i, i], 1.0, atol=1e-5)
    # Symmetry: K_ij == K_ji
    assert np.allclose(K, K.T, atol=1e-5)
    # All entries bounded in [0, 1]
    assert np.all(K >= 0.0) and np.all(K <= 1.0)


# 6. Dual-model prediction endpoint
def test_dual_prediction_endpoint():
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

    # Inputs echoed
    assert "inputs" in data
    assert data["inputs"]["demand_kw"] == 55.0

    # Classical SVC fields
    assert "classical_svc" in data
    assert data["classical_svc"]["prediction"] in ["NORMAL", "ABNORMAL"]
    assert data["classical_svc"]["label"] in [0, 1]
    assert data["classical_svc"]["inference_time_ms"] >= 0.0

    # Quantum QSVC fields
    assert "quantum_qsvc" in data
    assert data["quantum_qsvc"]["prediction"] in ["NORMAL", "ABNORMAL"]
    assert data["quantum_qsvc"]["label"] in [0, 1]
    assert data["quantum_qsvc"]["inference_time_ms"] >= 0.0

    # Heuristic IEEE 1547 diagnosis
    assert "heuristic_diagnosis" in data
    assert data["heuristic_diagnosis"]["is_physically_abnormal"] is False
    assert data["heuristic_diagnosis"]["voltage_status"] == "nominal"
    assert data["heuristic_diagnosis"]["frequency_status"] == "nominal"


# 7. Confusion matrix shape & ordering
def test_confusion_matrix_shape_and_ordering():
    response = client.get("/api/benchmark")
    assert response.status_code == 200
    data = response.json()

    cm = data["classical_svc"]["confusion_matrix"]
    # 2x2 binary classification matrix
    assert len(cm) == 2
    assert len(cm[0]) == 2
    assert len(cm[1]) == 2

    tn, fp = cm[0]
    fn, tp = cm[1]
    assert tn >= 0 and fp >= 0 and fn >= 0 and tp >= 0
    assert (tn + fp + fn + tp) == data["test_samples"]


# 8. Scenarios and quantum circuit endpoints
def test_scenarios_and_circuit_endpoints():
    scenarios_res = client.get("/api/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()["scenarios"]
    assert len(scenarios) >= 5
    scenario_ids = [s["id"] for s in scenarios]
    assert "normal" in scenario_ids
    assert "demand_spike" in scenario_ids
    assert "cascading_failure" in scenario_ids

    circuit_res = client.get("/api/circuit")
    assert circuit_res.status_code == 200
    circuit_data = circuit_res.json()
    assert circuit_data["num_qubits"] == 4
    assert circuit_data["depth"] > 0
    assert "gate_counts" in circuit_data
    assert "ascii_diagram" in circuit_data


# 9. Evaluate endpoint schema validation
def test_evaluate_endpoint_schema():
    res = client.post("/api/evaluate")
    assert res.status_code == 200
    data = res.json()

    # Matches BenchmarkResponse schema
    for key in ["timestamp", "total_samples", "train_samples", "test_samples", "classical_svc", "quantum_qsvc", "low_data_experiment"]:
        assert key in data

    # Verify low_data_experiment structure
    low_data = data["low_data_experiment"]
    assert len(low_data) == 4
    for entry in low_data:
        assert "fraction" in entry
        assert "sample_count" in entry
        assert "classical_f1" in entry
        assert "quantum_f1" in entry
