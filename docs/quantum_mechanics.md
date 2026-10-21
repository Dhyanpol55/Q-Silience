# Quantum Mechanics & Circuit Theory for Microgrid Anomaly Detection

## 1. Feature Map Topology
The microgrid state is embedded using Qiskit's `ZZFeatureMap` with linear entanglement topology:
- **Feature Dimension ($n$):** 4 qubits
- **Entanglement Entanglers ($E$):** Linear nearest-neighbor connectivity: $(q_0, q_1), (q_1, q_2), (q_2, q_3)$
- **Repetitions ($d$):** 2 cycles
- **State Space Dimension:** $\mathcal{H} = \mathbb{C}^{2^4} = \mathbb{C}^{16}$

## 2. Gate Decomposition
Each repetition cycle $l \in \{1, 2\}$ decomposes into elementary hardware-native gates:
1. **Layer 1: Hadamard Basis Initialization**
   $$H^{\otimes 4} |0000\rangle = \frac{1}{4} \sum_{k=0}^{15} |k\rangle$$
2. **Layer 2: Single-Qubit Phase Encoding ($R_z$)**
   $$R_z(\theta_j) = \exp\left(-i \frac{\theta_j}{2} Z_j\right), \quad \theta_j = 2 x_j$$
3. **Layer 3: Two-Qubit Entangling ZZ Interactions ($CNOT - R_z - CNOT$)**
   $$U_{ZZ}(\theta_{jk}) = \text{CNOT}_{jk} \cdot (I \otimes R_z(\theta_{jk})) \cdot \text{CNOT}_{jk}$$
   Where $\theta_{jk} = 2 (\pi - x_j)(\pi - x_k)$.

## 3. Circuit Metrics
| Metric | Value | Technical Rationale |
| :--- | :--- | :--- |
| Qubits | 4 | Encodes Active Load, PV Generation, Feeder Voltage, Bus Frequency |
| Circuit Depth | 8 layers ($d=2$) | Low-depth design suitable for NISQ simulators and quantum processors |
| Single-Qubit Gates | 16 ($H$ and $R_z$) | Single-qubit rotation operations |
| Two-Qubit CNOTs | 12 ($CX$) | Nearest-neighbor entangling pairs |
| Total Quantum Gates | 28 gates | Compact footprint minimizing decoherence |

## 4. Kernel Alignment and Evaluation
The inner product fidelity between feature vectors $x_i$ and $x_j$ is evaluated via the swap test or transition amplitude:
$$K_{ij} = |\langle 0^{\otimes n} | U_{\Phi}^\dagger(x_j) U_{\Phi}(x_i) | 0^{\otimes n} \rangle|^2$$
- $K_{ii} = 1.0$ (Identity / Self-overlap)
- $K_{ij} = K_{ji} \in [0.0, 1.0]$ (Symmetric Gram matrix)
