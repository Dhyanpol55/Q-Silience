"""
Quantum Machine Learning Engine
Implements genuine Qiskit ZZFeatureMap, FidelityQuantumKernel, and QSVC classifier.
"""

import time
from typing import Dict, Tuple, Any, Optional
import numpy as np

try:
    from qiskit.circuit.library import ZZFeatureMap
    from qiskit.quantum_info import Statevector
    from qiskit_machine_learning.kernels import FidelityQuantumKernel
    from qiskit_machine_learning.algorithms import QSVC
    QISKIT_AVAILABLE = True
    QISKIT_IMPORT_ERROR = None
except Exception as e:
    QISKIT_AVAILABLE = False
    QISKIT_IMPORT_ERROR = str(e)


def build_zz_feature_map(
    num_qubits: int = 4,
    reps: int = 2,
    entanglement: str = "linear",
):
    """
    Constructs a Qiskit ZZFeatureMap circuit.
    
    U_phi(x) = [ exp(i sum phi_jk(x) Z_j Z_k) exp(i sum phi_j(x) Z_j) H^n ]^d
    """
    if not QISKIT_AVAILABLE:
        raise ImportError(
            f"Qiskit Machine Learning is required for quantum circuit construction. Error: {QISKIT_IMPORT_ERROR}"
        )

    return ZZFeatureMap(
        feature_dimension=num_qubits,
        reps=reps,
        entanglement=entanglement,
        insert_barriers=True,
    )


def get_circuit_metadata(circuit) -> Dict[str, Any]:
    """
    Extracts actual circuit specifications directly from the Qiskit circuit object.
    """
    return {
        "num_qubits": circuit.num_qubits,
        "depth": circuit.depth(),
        "total_gates": sum(circuit.count_ops().values()),
        "gate_counts": dict(circuit.count_ops()),
        "ascii_diagram": str(circuit.draw(output="text")),
    }


def train_quantum_qsvc(
    X_train: np.ndarray,
    y_train: np.ndarray,
    num_qubits: int = 4,
    reps: int = 2,
    C: float = 1.0,
) -> Tuple[Any, float, Dict[str, Any]]:
    """
    Trains genuine QSVC model with FidelityQuantumKernel using statevector fidelity evaluation.
    
    Returns:
        (fitted_qsvc, training_time_ms, circuit_metadata)
    """
    if not QISKIT_AVAILABLE:
        raise RuntimeError(
            f"Cannot train quantum classifier: Qiskit or Qiskit Machine Learning is unavailable: {QISKIT_IMPORT_ERROR}"
        )

    # 1. Construct Quantum Feature Map
    feature_map = build_zz_feature_map(num_qubits=num_qubits, reps=reps)
    circuit_meta = get_circuit_metadata(feature_map)

    # 2. Construct FidelityQuantumKernel
    quantum_kernel = FidelityQuantumKernel(feature_map=feature_map)

    # 3. Instantiate and fit QSVC
    qsvc = QSVC(quantum_kernel=quantum_kernel, C=C)

    t0 = time.perf_counter()
    qsvc.fit(X_train, y_train)
    t1 = time.perf_counter()

    train_time_ms = (t1 - t0) * 1000.0
    return qsvc, train_time_ms, circuit_meta


def predict_quantum(
    qsvc: Any,
    X_test: np.ndarray,
) -> Tuple[np.ndarray, float]:
    """
    Inference with trained QSVC model.
    
    Returns:
        (predicted_labels, inference_time_ms)
    """
    t0 = time.perf_counter()
    preds = qsvc.predict(X_test)
    t1 = time.perf_counter()
    inference_time_ms = (t1 - t0) * 1000.0
    return preds, inference_time_ms
