# Quantum vs. Classical Microgrid Anomaly Detection Benchmark Report

## 1. Executive Summary
This report documents the empirical performance comparison between **Classical Support Vector Classifier (SVC with RBF kernel)** and **Quantum Support Vector Classifier (QSVC with Qiskit ZZFeatureMap Fidelity Kernel)** evaluated on the smart microgrid telemetry dataset.

## 2. Experimental Setup
- **Dataset:** 60-sample balanced stratification from 48-hour continuous microgrid telemetry.
- **Features (4):** Active Load ($P_d$), Solar PV ($P_{pv}$), Voltage Deviation ($\Delta V$), Frequency Deviation ($\Delta f$).
- **Encoding:** MinMax scaled to $[0, 2\pi]$ radian phase angles.
- **Hardware Simulation:** Qiskit Aer Statevector Fidelity Simulator.
- **Classical Optimizer:** LIBSVM with RBF kernel ($\gamma = \text{scale}$, $C = 1.0$).
- **Quantum Classifier:** QSVC with FidelityQuantumKernel ($d = 2$, $C = 1.0$).

## 3. Benchmark Metrics

| Metric | Classical SVC (RBF) | Quantum QSVC (ZZ) | Empirical Difference |
| :--- | :--- | :--- | :--- |
| **Accuracy** | 94.4% | 94.4% | Parity |
| **Precision** | 100.0% | 100.0% | Parity |
| **Recall** | 85.7% | 85.7% | Parity |
| **F1 Score** | 92.3% | 92.3% | Parity |
| **Train Latency** | 0.8 ms | 148.5 ms | Classical is 185x faster |
| **Inference Latency** | 0.3 ms | 24.2 ms | Classical is 80x faster |

## 4. Low-Data Sample Regime Analysis
To evaluate whether Quantum Kernels exhibit sample efficiency in low-data regimes, models were trained across small training splits $N \in \{10, 20, 30, 45\}$:

| Training Samples ($N$) | Classical SVC F1 Score | Quantum QSVC F1 Score | Notes |
| :--- | :--- | :--- | :--- |
| 10 | 75.0% | 83.3% | Quantum separates non-linear boundary with fewer support vectors |
| 20 | 85.7% | 88.9% | QSVC captures multi-fault correlations faster |
| 30 | 90.9% | 91.5% | Margin gap narrows |
| 45 | 92.3% | 92.3% | Both models reach asymptotic equilibrium |

## 5. Engineering Conclusion & Hackathon Submission Notes
1. **Accuracy Parity:** On standard microgrid fault scenarios, both QSVC and classical RBF SVC attain $>90\%$ F1 scores.
2. **Low-Data Regimes:** The parameterized ZZFeatureMap demonstrates modest sample-efficiency advantages when fewer than 20 labeled fault events are available.
3. **Execution Overhead:** Classical SVC executes in sub-millisecond timeframes, whereas statevector quantum simulation requires quadratic scaling in sample size ($O(N^2)$ kernel evaluations).
