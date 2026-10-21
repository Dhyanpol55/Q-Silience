<div align="center">

# Ctrl_AI — Q-Resilience AI

### Quantum-Enhanced Microgrid Anomaly Detection

**VTU-QFF-HC-0025** &nbsp;|&nbsp; Tier: **Both**

</div>

---

<div align="center">

| | |
| :--- | :--- |
| **Team** | Ctrl_AI |
| **Team ID** | VTU-QFF-HC-0025 |
| **Tier** | Both (Online + Offline) |
| **Track** | Quantum + AI & ML |
| **Repository** | [vtu-hc-ctrl-ai](https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai.git) |
| **Organisation** | [vtu-qiskit-fall-fest-2026](https://github.com/vtu-qiskit-fall-fest-2026) |
| **Event** | VTU-QFF Hackathon — VTU-Qiskit Fall Fest 2026 |

</div>

---

## 📌 Table of Contents

- [Team Members](#-team-members-github-ids)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Approach & Architecture](#-approach--architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Data Pipeline](#-data-pipeline)
- [How to Run](#-how-to-run)
- [API Endpoints](#-api-endpoints)
- [Evaluation & Findings](#-evaluation--findings)
- [License](#-license)

---

## 👥 Team Members (GitHub IDs)

| # | Name | GitHub Username | Role |
| :-- | :--- | :--- | :--- |
| 1 | *Team Lead* | @devil_Mike | *Quantum ML & Algorithms* |
| 2 | *ML Engineer* | @dhyanpol99 | *Classical ML & Pipeline* |
| 3 | *Systems Engineer* | @collaborator | *FastAPI Backend & Streamlit* |

---

## ❓ Problem Statement

**Problem:** Decentralized renewable microgrids integrating solar PV arrays, Battery Energy Storage Systems (BESS), and dynamic loads exhibit low rotational grid inertia and high intermittency. Conventional rule-based relays miss coupled transients where subtle simultaneous variations in voltage, frequency, and battery discharge state precede catastrophic distribution failure.

**Why it matters:** Fast, accurate anomaly classification prevents under-frequency load shedding, protects battery assets from deep degradation, and maintains grid resilience without unnecessary generation curtailment.

**Track / Category:** VTU Qiskit Fall Fest 2026 · Track: Quantum + AI & ML · Smart Energy & Power Quality

---

## 💡 Proposed Solution

**Solution:** Q-Resilience AI deploys a hybrid quantum-classical anomaly detector that maps 4 continuous microgrid sensor features into a 16-dimensional complex Hilbert space using a 4-qubit **Qiskit ZZFeatureMap**. It constructs a **Fidelity Quantum Kernel** ($K(x_i, x_j) = |\langle \phi(x_i) | \phi(x_j) \rangle|^2$) and trains a **Quantum Support Vector Classifier (QSVC)** alongside a classical scikit-learn Support Vector Classifier (RBF kernel) on identical stratified telemetry splits.

**Key idea:** Two-qubit entangling phase interactions ($e^{i \cdot 2(\pi - x_j)(\pi - x_k) Z_j Z_k}$) exploit quantum Hilbert state geometry to detect non-linear multi-variable sensor correlations even in data-sparse operational regimes.

**Why this works:** The parameterized unitary creates structured decision margins between nominal equilibrium and transient anomalies (load surges, PV trips, voltage sags) that classical kernels require extensive tuning or large training corpora to isolate.

---

## 🧩 Approach & Architecture

```mermaid
flowchart LR
    A[Microgrid Sensors<br/>Demand, Solar, SoC, ΔV, Δf] --> B[MinMax Scaler<br/>Range: 0 to 2π]
    B --> C[Qiskit ZZFeatureMap<br/>4 Qubits, Reps: 2]
    C --> D[Fidelity Quantum Kernel<br/>Statevector Simulator]
    D --> E[QSVC Classifier<br/>Dual SMO Solver]
    E --> F[Anomaly Prediction &<br/>IEEE 1547 Diagnosis]
```

1. **Input Telemetry:** 5 physical parameters (Demand kW, Solar kW, Battery SoC %, Voltage Deviation V, Frequency Deviation Hz).
2. **Preprocessing:** Stratified train/test split (75/25); MinMaxScaler fitted strictly on training data mapping into $[0, 2\pi]$ to prevent data leakage.
3. **Quantum Core:** Qiskit parameterized `ZZFeatureMap(feature_dimension=4, reps=2, entanglement='linear')` executed on statevector simulator.
4. **Kernel Evaluation:** Pairwise quantum state transition fidelity matrix $K_{ij} = |\langle \phi(x_i) | \phi(x_j) \rangle|^2 \in [0, 1]$.
5. **Classification & Verification:** QSVC trained with $C=1.0$ compared directly with classical RBF SVC.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Language** | Python 3.11+ |
| **Quantum SDK** | Qiskit `>=1.0`, Qiskit Machine Learning `>=0.7`, Qiskit Algorithms |
| **Classical ML** | Scikit-learn `>=1.5`, NumPy, Pandas |
| **Backend API** | FastAPI `>=0.115`, Uvicorn |
| **Frontend Dashboard** | React 19, TypeScript, Tailwind CSS, Recharts, Streamlit |
| **Testing** | Pytest, HTTPX |
| **Deployment** | Render (FastAPI Backend) + Vercel (Interactive Frontend) |

---

## 📁 Project Structure

```text
vtu-hc-ctrl-ai/
├── README.md              # Project documentation and hackathon submission
├── requirements.txt       # Tested, pinned dependencies
├── render.yaml            # Render Blueprint for automated backend deployment
├── data/
│   └── microgrid_telemetry.csv  # Reproducible microgrid dataset
├── notebooks/
│   └── exploration.ipynb  # End-to-end Jupyter experiment notebook
├── src/
│   ├── __init__.py
│   ├── data_generator.py  # Deterministic sensor simulator & schema validator
│   ├── preprocessing.py   # Stratified splitting & [0, 2pi] angle scaler
│   ├── classical_model.py # Scikit-learn SVC (RBF) baseline
│   ├── quantum_model.py   # Qiskit ZZFeatureMap & FidelityQuantumKernel QSVC
│   ├── evaluation.py      # Precision, recall, F1, confusion matrices
│   └── scenario_engine.py # Preset grid stress scenarios & IEEE 1547 rules
├── backend/
│   ├── main.py            # FastAPI production application
│   ├── requirements.txt   # Backend-specific dependencies
│   └── tests/
│       └── test_api.py    # FastAPI endpoint test suite
└── tests/
    ├── test_data_generator.py
    ├── test_preprocessing.py
    └── test_evaluation.py
```

---

## 📊 Data Pipeline

The dataset includes reproducible observations with transparent physical rules:
- **Normal Equilibrium:** Load balanced with generation; $\Delta V \in \pm 3\text{V}$, $\Delta f \in \pm 0.05\text{Hz}$.
- **Sudden Demand Spike:** Heavy manufacturing surge causing BESS discharge saturation and voltage sag.
- **Solar PV Inverter Trip:** Midday 85% generation collapse triggering frequency droop.
- **Feeder Voltage Sag:** Line impedance step fault breaching $\pm 6\text{V}$.
- **Cascading Failure:** Low battery ($<15\%$) + solar drop + peak demand.

Direct data access URL:
```
https://raw.githubusercontent.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai/main/data/microgrid_telemetry.csv
```

---

## 🚀 How to Run

### 1. Clone the repository
```bash
git clone https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai.git
cd vtu-hc-ctrl-ai
```

### 2. Set up virtual environment
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Run automated tests
```bash
pytest -v
```

### 4. Start the FastAPI backend
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Launch the Streamlit dashboard
```bash
streamlit run app.py
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Check backend status and Qiskit version |
| `GET` | `/api/dataset` | Retrieve current microgrid telemetry |
| `POST` | `/api/predict` | Real-time dual classical + quantum inference |
| `GET` | `/api/circuit` | Extract Qiskit ZZFeatureMap gate representation |
| `GET` | `/api/benchmark` | Retrieve metrics, confusion matrices, and low-data curves |

---

## 📈 Evaluation & Findings

- **Accuracy & F1-Score:** Both Classical SVC (RBF) and Quantum QSVC achieve $>90\%$ classification accuracy on the held-out test split.
- **Low-Data Generalization:** In 25%–50% sample regimes, the quantum kernel maintains competitive F1-scores due to the fixed geometric structuring of the non-linear entangling unitary.
- **Computational Considerations:** Quantum kernel Gram matrix evaluation scales as $O(N^2)$ statevector inner products, highlighting the trade-off between kernel expressivity and classical evaluation latency.

---

<div align="center">

**Ctrl_AI** · Team ID `VTU-QFF-HC-0025` · Tier `Both`  
Built with ⚛️ Qiskit for the VTU-QFF Hackathon — VTU-Qiskit Fall Fest 2026  
[⬆ Back to Top](#ctrl_ai--q-resilience-ai)

</div>
