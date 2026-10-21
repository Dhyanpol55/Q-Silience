<div align="center">

# Ctrl_AI

**VTU-QFF-HC-0025** &nbsp;|&nbsp; Tier: **Both**

</div>

---

<div align="center">

| | |
| :--- | :--- |
| **Team** | Ctrl_AI |
| **Team ID** | VTU-QFF-HC-0025 |
| **Tier** | Both |
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
- [How to Run](#-how-to-run)
- [How to Push Code](#-how-to-push-code)
- [Submission Checklist](#-submission-checklist)
- [Resources](#-resources)
- [License](#-license)

---

## 👥 Team Members (GitHub IDs)

> Members are added to this repository as **collaborators** and must accept the
> GitHub invitation before they can push. Add your GitHub username below.

| # | Name | GitHub Username | Role |
| :-- | :--- | :--- | :--- |
| 1 | Dhyan Pol | `@dhyanpol99` | Team Lead & Quantum ML Engineer |
| 2 | Team Ctrl_AI Member | `@ctrl-ai-dev` | Full-Stack & Systems Developer |
| 3 | Team Ctrl_AI Member | `@vtu-qiskit-dev` | Data & Grid Simulation Engineer |

---

## ❓ Problem Statement

**Problem:** Modern decentralized microgrids integrate intermittent renewable generation (solar PV), energy storage (BESS), and dynamic industrial loads, creating complex multi-variable operating regimes where non-linear fault events—such as voltage regulation violations, inverter trips, and frequency instabilities—are difficult to detect with traditional thresholding or classical linear classifiers in low-labeled-data scenarios.

**Why it matters:** Fast, accurate anomaly detection prevents catastrophic microgrid islanding, equipment degradation, and cascading blackouts while enhancing grid resilience and autonomous self-healing.

**Track / Category:** VTU-Qiskit Fall Fest 2026 · Tier: Both (Online & Offline) · Quantum Machine Learning & Clean Energy Resilience

---

## 💡 Proposed Solution

**Solution:** **Q-Resilience AI** is an end-to-end quantum-classical microgrid anomaly detection platform. It simulates 48-hour continuous smart grid telemetry, maps physical feature interactions into a 16-dimensional Hilbert space using Qiskit's parameterized `ZZFeatureMap`, calculates Fidelity Quantum Kernels, and trains a Quantum Support Vector Classifier (QSVC) that fairly benchmarks against classical scikit-learn Support Vector Classifiers on identical data splits.

**Key idea:** Non-linear microgrid sensor interactions (load demand, solar generation, voltage deviation, and frequency stability) are mapped into higher-dimensional quantum state fidelity space where complex multi-fault boundaries become linearly separable with fewer labeled training samples.

**Why this works:** The parameterized ZZFeatureMap captures pairwise feature correlations $\phi_{jk}(x) = 2(\pi - x_j)(\pi - x_k)$ via entangling two-qubit $CNOT - R_z - CNOT$ unitaries, creating a non-linear quantum feature space that outperforms classical RBF kernels in low-sample regimes while maintaining rigorous evaluation parity.

---

## 🧩 Approach & Architecture

```mermaid
flowchart LR
    A[Microgrid Sensor Data<br/>Demand, Solar, Voltage, Freq] --> B[MinMax Angle Scaling<br/>0 to 2pi radians]
    B --> C[Qiskit ZZFeatureMap<br/>4 Qubits, d=2 reps]
    C --> D[Fidelity Quantum Kernel<br/>K_ij = |braket(phi_i, phi_j)|^2]
    D --> E[QSVC Classifier<br/>& Classical SVC Benchmark]
    E --> F[Grid Resilience Dashboard<br/>Live Stream & Scenario Lab]
```

1. **Input** — 5-channel physical telemetry: active demand ($P_d$ kW), solar PV generation ($P_{pv}$ kW), battery state-of-charge (SoC %), feeder voltage deviation ($\Delta V$), and bus frequency deviation ($\Delta f$).
2. **Preprocessing** — Min-Max normalization onto $[0, 2\pi]$ radians for phase angle parameterization into quantum rotation gates.
3. **Quantum core** — 4-qubit parameterized `ZZFeatureMap` with linear nearest-neighbor entanglement topology, 2 repetition cycles ($d=2$), and statevector fidelity calculation.
4. **Post-processing** — Dual-model training (Quantum QSVC vs Classical SVC with RBF kernel), cross-validation, and metrics computation (Accuracy, Precision, Recall, F1 score, Confusion Matrix, Latency).
5. **Output** — Real-time interactive dashboard on Vercel with live stream simulation, fault injection, scenario lab, and automated exportable audit reports.


---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Language | Python 3.11+ |
| Quantum SDK | Qiskit `>=1.0`, Qiskit Aer, Qiskit Runtime |
| Optimisation | Qiskit Optimization / COBYLA / SPSA |
| Simulation | AerSimulator (statevector / noisemodel) |
| Environment | JupyterLab / VS Code, `venv` |
| Version control | Git + GitHub |

---

## 📁 Project Structure

```text
vtu-hc-ctrl-ai/
├── README.md              # This file
├── requirements.txt       # Python dependencies
├── pyproject.toml         # Project metadata (optional)
├── .gitignore
├── notebooks/             # Jupyter notebooks for experiments
│   └── exploration.ipynb
├── src/
│   ├── __init__.py
│   ├── circuit.py         # Quantum circuit construction
│   ├── optimizer.py       # Optimization loop
│   └── main.py            # Entry point
├── data/                  # Datasets (use Git LFS for large files)
├── tests/                 # Unit tests
│   └── test_circuit.py
└── docs/                  # Notes, diagrams, reports
```

---

## 🚀 How to Run

### Prerequisites

- Python 3.11 or newer
- [Git](https://git-scm.com/downloads)
- A GitHub account (you need collaborator access to this repo)

### 1. Clone the repository

```bash
git clone https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai.git
cd vtu-hc-ctrl-ai
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows (PowerShell)
```

### 3. Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run

```bash
python -m src.main
```

Or launch the notebook workflow:

```bash
jupyter lab
```

### 5. Run the tests

```bash
pytest -q
```

---

## 🔁 How to Push Code

> Full walkthrough: **[Git & Collaboration Handbook](../vtu-hc-guide-git-and-collaboration)** — collaboration
> workflow, branches, pull requests, reviews and conflict resolution.

### Configure Git (first time only)

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

### Everyday workflow

```bash
# 1. Get the latest changes
git checkout main
git pull origin main

# 2. Create a branch for your work
git checkout -b feature/my-task

# 3. Commit your work
git add .
git commit -m "feat: add variational circuit for the search problem"

# 4. Push the branch
git push -u origin feature/my-task

# 5. Open a Pull Request on GitHub and request a review
#    https://github.com/vtu-qiskit-fall-fest-2026/vtu-hc-ctrl-ai/compare/main...feature/my-task

# 6. After approval, merge into main
git checkout main
git pull origin main
git branch -d feature/my-task
```

### Commit message convention

| Prefix | Meaning |
| :--- | :--- |
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `refactor:` | Code restructure, no behaviour change |
| `chore:` | Build/config/dependency changes |

### Useful commands

```bash
git status              # what changed
git log --oneline -10   # recent commits
git diff                # review changes before committing
git stash               # shelve changes temporarily
git pull --rebase       # update your branch on top of main
```

### Collaborating on the same repo

- **Never push directly to `main`** — open a Pull Request.
- **Pull before you push** to avoid rejected commits.
- **Commit often** with clear messages.
- **Resolve conflicts** locally: `git pull --rebase`, fix the files, then `git add` + `git rebase --continue`.
- **Ask for a review** before merging — a second pair of eyes catches bugs fast.

---

## ✅ Submission Checklist

- [ ] Repository created and **public**
- [ ] All team members added as **collaborators** and invitations accepted
- [ ] `README.md` updated with project details, problem statement and solution
- [ ] Team members listed under [Team Members](#-team-members-github-ids)
- [ ] `requirements.txt` committed and project runs from a clean clone
- [ ] Code pushed to `main` and the latest `main` builds successfully
- [ ] Notebooks committed with **cleared outputs** (or use `nbstrip`)
- [ ] `README` includes a demo screenshot / video link
- [ ] Short project summary submitted on the hackathon portal

---

## 📚 Resources

| Resource | Link |
| :--- | :--- |
| 🔁 Git & collaboration handbook | [Git & Collaboration Handbook](../vtu-hc-guide-git-and-collaboration) |
| ❓ Problem statements, solutions & terms | [Problem Statements, Solutions & Terms](../vtu-hc-guide-problem-and-solution) |
| 📄 README writing guide | [README Guide & Template](../vtu-hc-guide-readme-template) |
| ⚛️ Qiskit documentation | https://docs.quantum.ibm.com/ |
| ⚛️ Qiskit Runtime & primitives | https://quantum.cloud.ibm.com/docs/ |
| 🧪 Qiskit Aer simulator | https://docs.quantum.ibm.com/guides/simulator |
| 💻 IBM Quantum Platform | https://quantum.cloud.ibm.com/ |
| 🎓 Qiskit textbook | https://qiskit.qotlabs.org/learning/ |
| 📋 GitHub Docs | https://docs.github.com/ |

---

## 📄 License

Released under the [MIT License](LICENSE). See `LICENSE` for details.

---

<div align="center">

**Ctrl_AI** · Team ID `VTU-QFF-HC-0025` · Tier `Both`
· Built with ⚛️ Qiskit for the VTU-QFF Hackathon

[⬆ Back to Top](#ctrl_ai)

</div>
