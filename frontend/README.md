# Q-Resilience AI — Frontend Single Page Application (SPA)

> Real-time Quantum & Classical Microgrid Anomaly Detection Dashboard  
> Built with **React 19**, **Vite**, **Tailwind CSS**, and **Recharts**.  
> Part of **VTU-Qiskit Fall Fest 2026** — Team Ctrl_AI (`VTU-QFF-HC-0025`).

---

## 🔗 Quick Links

- **Live Frontend**: [https://qresilience.vercel.app](https://qresilience.vercel.app)
- **Live Backend API**: [https://q-silience.onrender.com](https://q-silience.onrender.com) (Health: [`/health`](https://q-silience.onrender.com/health) · Benchmark: [`/api/benchmark`](https://q-silience.onrender.com/api/benchmark))
- **GitHub Repository**: [https://github.com/Dhyanpol55/Q-Silience](https://github.com/Dhyanpol55/Q-Silience)
- **Hackathon Repository**: [https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai.git](https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai.git)
- **Video Demonstration**: [https://youtu.be/HAgrzv3rs3k](https://youtu.be/HAgrzv3rs3k)

---

## 📊 Measured Benchmark Readings (Live Backend Verified)

The platform compares a **Classical Support Vector Classifier (RBF kernel)** against a **Genuine Quantum Support Vector Classifier (Qiskit ML QSVC with ZZFeatureMap Fidelity Kernel)** evaluated on stratified synthetic microgrid telemetry ($n=60$, 75% train / 25% test partition):

| Metric | Classical Baseline (Scikit-Learn SVC) | Genuine Quantum Model (Qiskit ML QSVC) | Comparison Notes |
| :--- | :--- | :--- | :--- |
| **Model Type** | `SVC(kernel="rbf", C=1.0)` | `QSVC(quantum_kernel=FidelityQuantumKernel)` | Exact model topologies |
| **Feature Map** | Classical Gaussian RBF | Qiskit `ZZFeatureMap` (4 qubits, reps=2, linear) | Hilbert space encoding |
| **Backend Environment** | Scikit-Learn 1.5.0 | Qiskit 1.4.6, Qiskit Machine Learning 0.8.2 | Python 3.11 on Render |
| **Backend Model Status** | `ready` | `genuine_qsvc` (`qml_available=true`) | Real Qiskit QML execution |
| **Test Accuracy** | **100.0%** (15 / 15 correct) | **86.7%** (13 / 15 correct) | Classical leads by +13.3% |
| **Precision** | **1.000** | **0.857** | Classical leads by +0.143 |
| **Recall** | **1.000** | **0.857** | Classical leads by +0.143 |
| **F1-Score** | **1.000** | **0.857** | Classical leads by +0.143 |
| **Training Time (45 samples)** | **3.1 ms** | **27,012.02 ms** (~27.0 seconds) | Classical is ~8,713x faster |
| **Inference Time (15 test samples)** | **0.35 ms** | **17,393.71 ms** (~17.4 seconds) | Classical is ~49,696x faster |

### Confusion Matrix Breakdown (Held-Out Test Set, n=15)
- **Classical SVC (RBF)**: `[[8, 0], [0, 7]]`
  - True Negatives: **8** | False Positives: **0** | False Negatives: **0** | True Positives: **7**
- **Genuine Qiskit QSVC**: `[[7, 1], [1, 6]]`
  - True Negatives: **7** | False Positives: **1** | False Negatives: **1** | True Positives: **6**

> **Scientific Disclosure**: The classical SVC baseline outperforms genuine QSVC in both accuracy and latency on this synthetic dataset. Quantum simulation latency reflects $O(2^n)$ statevector calculation and $O(N^2)$ kernel matrix evaluations. Zero claims of quantum supremacy or sample-efficiency advantage are asserted.

---

## 🛠️ Dashboard Architecture & Views

1. **Overview Dashboard**: High-level telemetry monitoring, active fault alerts, and health metrics.
2. **Scenario Lab**: Interactive simulation of IEEE 1547.4 microgrid operational stress conditions (PV intermittency, load surge, battery failure, cyber injection).
3. **Anomaly Investigation**: In-depth telemetry analysis, 4-qubit quantum state amplitudes, and dynamic parameter tuning.
4. **Live Stream**: Real-time simulated microgrid telemetry stream with instant classical vs quantum dual-model inference.
5. **Quantum Lab**: Interactive circuit visualizer showing Qiskit `ZZFeatureMap` parameterized rotations ($R_z$, $CX$, $ZZ(\theta)$) and Bloch sphere state projections.
6. **Benchmark & Validation**: Rigorous empirical performance comparison with toggle between **Local Demo** (in-browser analytical simulation) and **Live Backend** (`/api/benchmark`).

---

## 🚀 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `frontend` directory:
```env
VITE_API_BASE_URL=https://q-silience.onrender.com
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to preview.

### 4. Build for Production
```bash
npm run build
```
Build output is generated into the `dist/` directory ready for deployment on Vercel.
