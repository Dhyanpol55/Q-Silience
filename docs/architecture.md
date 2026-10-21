# Q-Resilience AI: Architecture Overview

**Team:** Ctrl_AI (`VTU-QFF-HC-0025`)  
**Hackathon:** VTU-Qiskit Fall Fest 2026 — Tier: Both  
**Repository:** [vtu-hc-ctrl-ai](https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai.git)

---

## 1. End-to-End System Pipeline

```mermaid
flowchart TD
    subgraph Microgrid_Telemetry [Smart Microgrid Telemetry Generation]
        T1[Active Load Demand P_d kW] --> P[Feature Normalization & MinMax Scaling]
        T2[Solar Photovoltaic P_pv kW] --> P
        T3[Battery Energy Storage SoC %] --> P
        T4[Feeder Voltage Deviation Delta_V] --> P
        T5[Bus Frequency Deviation Delta_f] --> P
    end

    subgraph Quantum_Core [Quantum Feature Encoding & Fidelity Kernel]
        P -->|Angles phi_i in 0, 2pi| QFM[4-Qubit ZZFeatureMap Circuit]
        QFM -->|Repetitions d=2, Linear Entanglement| Hilbert[16-Dimensional Hilbert Space]
        Hilbert --> QK[Fidelity Quantum Kernel Evaluation K_ij = |<phi_i|phi_j>|^2]
    end

    subgraph Dual_Model_Benchmarking [Fair Classifier Benchmarking]
        QK --> QSVC[Quantum QSVC Classifier]
        P --> CSVC[Classical SVC Baseline RBF Kernel]
        QSVC --> Eval[Evaluation Engine: Accuracy, Precision, Recall, F1, Confusion Matrix]
        CSVC --> Eval
    end

    subgraph Application_Delivery [Distributed Deployment Architecture]
        Eval --> Fast[FastAPI ML Service on Render]
        Fast -->|REST API / Live Stream| React[React + TypeScript + Tailwind Frontend on Vercel]
        React --> Dash[Real-Time Interactive Dashboard & Scenario Lab]
    end
```

---

## 2. Microgrid Feature Vector Formulation

The physical state of a distribution feeder microgrid is parameterized as a 4-dimensional normalized vector:

$$x = [x_0, x_1, x_2, x_3]^T \in [0, 2\pi]^4$$

| Qubit | Feature Channel | Engineering Unit | Nominal Operating Band | Anomaly Trigger Criterion |
| :--- | :--- | :--- | :--- | :--- |
| $q_0$ | Active Demand ($P_d$) | kW | $40 - 80$ kW | $> 120$ kW (Load Surge) |
| $q_1$ | Solar Generation ($P_{pv}$) | kW | Diurnal curve ($0 - 65$ kW) | Step drop $> 85\%$ without cloud cover |
| $q_2$ | Voltage Deviation ($\Delta V$) | Volts ($V$) | $\pm 3.0$ V | $|\Delta V| > 6.0$ V (Feeder impedance sag/swell) |
| $q_3$ | Frequency Deviation ($\Delta f$) | Hertz (Hz) | $\pm 0.05$ Hz | $|\Delta f| > 0.20$ Hz (Loss of primary reserve) |

---

## 3. Mathematical Formulation of Quantum Kernel

For two sensor vectors $x_i, x_j \in \mathbb{R}^4$, the quantum state is prepared via the parameterized unitary:

$$|\Phi(x)\rangle = U_{\Phi}(x) |0\rangle^{\otimes 4}$$

Where the unitary is defined as:

$$U_{\Phi}(x) = \left[ \prod_{(j, k) \in E} \exp\left(2i (\pi - x_j)(\pi - x_k) Z_j Z_k\right) \prod_{j=0}^{3} \exp\left(2i x_j Z_j\right) H^{\otimes 4} \right]^d$$

The Quantum Fidelity Kernel Gram matrix entry is defined as:

$$K_{ij} = |\langle \Phi(x_i) | \Phi(x_j) \rangle|^2$$

This kernel fulfills the Mercer condition and projects non-linearly separable anomalous operating patterns into a 16-dimensional complex projective Hilbert space where maximum-margin hyperplanes separate faults from nominal grid behavior.
