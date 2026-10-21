"""
vtu-hc-ctrl-ai: Q-Resilience AI package
Quantum-Enhanced Microgrid Anomaly Detection
VTU-Qiskit Fall Fest 2026 - Team Ctrl_AI (VTU-QFF-HC-0025)
"""

from .circuit import (
    build_circuit,
    build_zz_feature_map,
    get_circuit_metadata,
    calculate_quantum_kernel,
)
from .optimizer import (
    QuantumOptimizer,
    train_quantum_qsvc,
    train_classical_svc,
    benchmark_models,
)

__version__ = "1.0.0"
__all__ = [
    "build_circuit",
    "build_zz_feature_map",
    "get_circuit_metadata",
    "calculate_quantum_kernel",
    "QuantumOptimizer",
    "train_quantum_qsvc",
    "train_classical_svc",
    "benchmark_models",
]
