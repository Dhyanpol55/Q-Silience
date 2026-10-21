"""
Unit Tests for Quantum Circuit and Optimization Pipeline
vtu-hc-ctrl-ai / tests / test_circuit.py

Tests quantum circuit construction, fidelity kernel mathematical properties,
QSVC training, and classical baseline benchmarks.
"""

import pytest
import numpy as np
import pandas as pd

from src.circuit import (
    build_circuit,
    build_zz_feature_map,
    get_circuit_metadata,
    calculate_quantum_kernel,
    compute_statevector_fallback,
)
from src.optimizer import (
    train_classical_svc,
    train_quantum_qsvc,
    benchmark_models,
    QuantumOptimizer,
    evaluate_predictions,
)


def test_circuit_construction():
    """Verify parameterized quantum circuit metadata and specifications."""
    num_qubits = 4
    reps = 2
    circuit = build_circuit(num_qubits=num_qubits, reps=reps)
    meta = get_circuit_metadata(circuit)

    assert meta["num_qubits"] == 4
    assert meta["depth"] > 0
    assert meta["total_gates"] > 0
    assert isinstance(meta["gate_counts"], dict)
    assert "ascii_diagram" in meta


def test_statevector_normalization():
    """Verify Hilbert space statevector is properly normalized to unit length."""
    x = np.array([0.5, 1.2, 2.4, 3.1])
    sv = compute_statevector_fallback(x, num_qubits=4, reps=2)

    assert len(sv) == 16  # 2^4 = 16
    norm = np.linalg.norm(sv)
    assert np.isclose(norm, 1.0, atol=1e-6)


def test_quantum_kernel_mathematical_properties():
    """Verify Gram matrix properties: unit diagonal, symmetry, and bounded [0, 1]."""
    X = np.array([
        [0.2, 0.8, 1.5, 2.0],
        [1.1, 2.3, 0.4, 3.0],
        [2.5, 0.1, 1.9, 0.7],
        [0.9, 1.4, 2.8, 1.2],
    ])
    circuit = build_circuit(num_qubits=4, reps=2)
    K = calculate_quantum_kernel(circuit, X, X)

    assert K.shape == (4, 4)

    # 1. Unit diagonal (self-fidelity |<phi(x)|phi(x)>|^2 == 1.0)
    for i in range(4):
        assert np.isclose(K[i, i], 1.0, atol=1e-5)

    # 2. Symmetry K_ij == K_ji
    for i in range(4):
        for j in range(4):
            assert np.isclose(K[i, j], K[j, i], atol=1e-5)

    # 3. Values bounded in [0.0, 1.0]
    assert np.all(K >= -1e-7)
    assert np.all(K <= 1.0 + 1e-7)


def test_classical_and_quantum_benchmark():
    """Test full comparative benchmark pipeline on microgrid sensor samples."""
    np.random.seed(42)
    # 20 samples (14 train, 6 test)
    X = np.random.uniform(0.0, 2.0 * np.pi, size=(20, 4))
    y = np.array([0]*12 + [1]*8)
    np.random.shuffle(y)

    X_train, X_test = X[:14], X[14:]
    y_train, y_test = y[:14], y[14:]

    results = benchmark_models(
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        num_qubits=4,
        reps=1,
        C=1.0,
    )

    assert "classical" in results
    assert "quantum" in results
    assert "verdict" in results
    assert results["winner"] in ["CLASSICAL", "QUANTUM", "TIE"]

    c = results["classical"]
    q = results["quantum"]

    for metrics in [c, q]:
        assert 0.0 <= metrics["accuracy"] <= 1.0
        assert 0.0 <= metrics["f1"] <= 1.0
        assert metrics["train_time_ms"] > 0.0
        assert len(metrics["confusion_matrix"]) == 2


def test_quantum_optimizer_loop():
    """Verify hyperparameter optimization loop executes cross-validation properly."""
    np.random.seed(42)
    X_train = np.random.uniform(0.0, 2.0 * np.pi, size=(12, 4))
    y_train = np.array([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1])

    optimizer = QuantumOptimizer(num_qubits=4, reps=1)
    best = optimizer.optimize_hyperparameters(
        X_train,
        y_train,
        c_candidates=[0.5, 1.0],
        reps_candidates=[1],
    )

    assert "C" in best
    assert "reps" in best
    assert len(optimizer.history) > 0
