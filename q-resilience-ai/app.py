"""
Q-RESILIENCE AI — Quantum-Enhanced Microgrid Anomaly Detection
Streamlit Web Application
Hackathon: VTU Qiskit Fall Fest 2026 | Track: Quantum + AI & ML
"""

import streamlit as st
import numpy as np
import pandas as pd
import json

from src.data_generator import generate_microgrid_dataset, validate_microgrid_dataframe, FEATURE_COLUMNS
from src.preprocessing import prepare_dataset_splits, MicrogridPreprocessor
from src.classical_model import train_classical_svc, predict_classical
from src.quantum_model import (
    train_quantum_qsvc,
    predict_quantum,
    build_zz_feature_map,
    get_circuit_metadata,
    QISKIT_AVAILABLE,
    QISKIT_IMPORT_ERROR,
)
from src.evaluation import evaluate_predictions, run_low_data_benchmark
from src.scenario_engine import PRESETS, diagnose_telemetry
from src.visualizations import plot_telemetry_distribution, plot_confusion_matrix, plot_low_data_comparison

st.set_page_config(
    page_title="Q-RESILIENCE AI — Quantum Microgrid Anomaly Detection",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Dark theme styling
st.markdown("""
<style>
    .main { background-color: #080d1a; color: #e2e8f0; }
    .stSidebar { background-color: #0b1120; border-right: 1px solid #1e293b; }
    .stMetric { background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; }
    .stButton>button { background-color: #0284c7; color: white; border-radius: 6px; border: none; font-weight: 600; }
    .stButton>button:hover { background-color: #0369a1; }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if "dataset" not in st.session_state:
    st.session_state.dataset = generate_microgrid_dataset(n_samples=120, seed=42)

# Sidebar
st.sidebar.title("⚡ Q-RESILIENCE AI")
st.sidebar.caption("VTU Qiskit Fall Fest 2026 · Quantum + AI & ML Track")

page = st.sidebar.radio(
    "Navigation",
    ["Overview", "Microgrid Scenario Lab", "Quantum Lab", "Model Benchmark", "Experiment Report"],
)

st.sidebar.markdown("---")
st.sidebar.subheader("Dataset Parameters")
sample_count = st.sidebar.slider("Number of Samples", 40, 200, 100, step=20)
random_seed = st.sidebar.number_input("Random Seed", value=42, step=1)

if st.sidebar.button("Regenerate Dataset"):
    st.session_state.dataset = generate_microgrid_dataset(n_samples=sample_count, seed=int(random_seed))
    st.sidebar.success(f"Generated {sample_count} samples.")

# Prepare model data
df = st.session_state.dataset
X_train, X_test, y_train, y_test, preprocessor = prepare_dataset_splits(df, seed=int(random_seed))


# -----------------------------------------------------------------------------
# PAGE 1: OVERVIEW
# -----------------------------------------------------------------------------
if page == "Overview":
    st.title("⚡ Q-RESILIENCE AI — Microgrid Anomaly Detection")
    st.markdown("""
    **Investigating Quantum Feature Mapping for Multi-Modal Microgrid Telemetry Classification**
    
    Microgrids combining solar PV, battery energy storage systems (BESS), and dynamic loads can experience 
    subtle or abrupt anomalies (feeder voltage collapse, sudden inverter trips, and underfrequency transients). 
    Q-Resilience AI investigates whether quantum feature mapping in a Hilbert state space (via **ZZFeatureMap**) 
    can separate abnormal grid operating conditions compared to classical RBF-kernel Support Vector Classifiers.
    """)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Samples", len(df))
    with col2:
        st.metric("Training Split (75%)", len(X_train))
    with col3:
        st.metric("Testing Split (25%)", len(X_test))
    with col4:
        abnormal_pct = (df["is_abnormal"].sum() / len(df)) * 100
        st.metric("Abnormal Ratio", f"{abnormal_pct:.1f}%")

    st.subheader("Simulated Telemetry Distribution")
    st.plotly_chart(plot_telemetry_distribution(df), use_container_width=True)

    st.info(
        "⚠️ **Scientific Disclaimer:** This application utilizes synthetic microgrid telemetry designed "
        "according to IEEE 1547 and EN 50160 power quality standards. Simulated dataset findings demonstrate "
        "quantum algorithm mechanics on local statevector simulators and do not establish production grid reliability guarantees."
    )


# -----------------------------------------------------------------------------
# PAGE 2: MICROGRID SCENARIO LAB
# -----------------------------------------------------------------------------
elif page == "Microgrid Scenario Lab":
    st.title("🔬 Interactive Microgrid Scenario Lab")
    st.markdown("Inject sensor values or select preset operational scenarios to evaluate real-time model inferences.")

    # Preset buttons
    preset_cols = st.columns(len(PRESETS))
    selected_preset = None
    for idx, (p_id, p_info) in enumerate(PRESETS.items()):
        if preset_cols[idx].button(p_info["name"]):
            selected_preset = p_info

    # Sensor controls
    st.subheader("Telemetry Inputs")
    c1, c2, c3, c4, c5 = st.columns(5)
    
    def_vals = selected_preset if selected_preset else PRESETS["normal"]
    
    with c1:
        demand = st.slider("Demand (kW)", 10.0, 180.0, float(def_vals["demand_kw"]))
    with c2:
        solar = st.slider("Solar PV (kW)", 0.0, 90.0, float(def_vals["solar_kw"]))
    with c3:
        soc = st.slider("Battery SoC (%)", 5.0, 100.0, float(def_vals["battery_soc_pct"]))
    with c4:
        voltage_dev = st.slider("Voltage Dev (V)", -20.0, 20.0, float(def_vals["voltage_dev_v"]))
    with c5:
        freq_dev = st.slider("Frequency Dev (Hz)", -1.0, 1.0, float(def_vals["frequency_dev_hz"]))

    input_dict = {
        "demand_kw": demand,
        "solar_kw": solar,
        "battery_soc_pct": soc,
        "voltage_dev_v": voltage_dev,
        "frequency_dev_hz": freq_dev,
    }

    # Physical diagnosis
    diagnosis = diagnose_telemetry(input_dict)
    st.markdown("### Engineering Heuristic Diagnosis")
    if diagnosis["warnings"]:
        for w in diagnosis["warnings"]:
            st.warning(f"⚠️ {w}")
    else:
        st.success("✅ Nominal operating state: all physical parameters comply with IEEE standards.")

    # Model inference
    st.markdown("### Model Predictions")
    single_df = pd.DataFrame([input_dict])
    X_single = preprocessor.transform(single_df)

    # Train models
    c_model, _ = train_classical_svc(X_train, y_train)
    c_pred, c_prob, c_inf_t = predict_classical(c_model, X_single)

    res_col1, res_col2 = st.columns(2)
    with res_col1:
        st.subheader("Classical SVC (RBF)")
        c_label = "ABNORMAL" if c_pred[0] == 1 else "NORMAL"
        st.write(f"**Predicted Class:** `{c_label}`")
        if c_prob is not None:
            st.write(f"**Abnormal Probability:** `{c_prob[0] * 100:.1f}%`")
        st.caption(f"Inference Latency: {c_inf_t:.2f} ms")

    with res_col2:
        st.subheader("Quantum QSVC (ZZFeatureMap)")
        if QISKIT_AVAILABLE:
            q_model, _, _ = train_quantum_qsvc(X_train, y_train, num_qubits=X_train.shape[1], reps=2)
            q_pred, q_inf_t = predict_quantum(q_model, X_single)
            q_label = "ABNORMAL" if q_pred[0] == 1 else "NORMAL"
            st.write(f"**Predicted Class:** `{q_label}`")
            st.caption(f"Inference Latency: {q_inf_t:.2f} ms")
        else:
            st.error(f"Quantum classifier unavailable: {QISKIT_IMPORT_ERROR}")


# -----------------------------------------------------------------------------
# PAGE 3: QUANTUM LAB
# -----------------------------------------------------------------------------
elif page == "Quantum Lab":
    st.title("⚛️ Quantum Feature Map & Circuit Architecture")
    st.markdown("""
    The quantum machine learning pipeline maps continuous classical microgrid sensor telemetry 
    $x = (x_1, x_2, x_3, x_4)$ into quantum statevectors $|\\phi(x)\\rangle$ in a $2^4 = 16$-dimensional 
    complex Hilbert space using **ZZFeatureMap**.
    """)

    if QISKIT_AVAILABLE:
        circuit = build_zz_feature_map(num_qubits=4, reps=2)
        meta = get_circuit_metadata(circuit)

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Number of Qubits", meta["num_qubits"])
        with col2:
            st.metric("Circuit Depth", meta["depth"])
        with col3:
            st.metric("Total Gates", meta["total_gates"])

        st.subheader("Qiskit Circuit ASCII Diagram")
        st.code(meta["ascii_diagram"], language="text")

        st.subheader("Mathematical Gate Formulation")
        st.latex(r"\mathcal{U}_{\Phi(x)} = \prod_{d=1}^2 \left[ \exp\left( i \sum_{j < k} \phi_{\{j,k\}}(x) Z_j Z_k \right) \exp\left( i \sum_j \phi_{\{j\}}(x) Z_j \right) H^{\otimes n} \right]")
        st.markdown("""
        - $\\phi_{\{j\}}(x) = 2 x_j$ encodes single-variable sensor readings via $R_z$ phase rotations.
        - $\\phi_{\{j,k\}}(x) = 2 (\\pi - x_j)(\\pi - x_k)$ encodes non-linear pairwise sensor correlations through CNOT-entangled $ZZ$ interactions.
        - Fidelity Quantum Kernel: $K(x_i, x_j) = |\\langle \\phi(x_i) | \\phi(x_j) \\rangle|^2 \\in [0, 1]$.
        """)
    else:
        st.error(f"Qiskit library could not be initialized: {QISKIT_IMPORT_ERROR}")


# -----------------------------------------------------------------------------
# PAGE 4: MODEL BENCHMARK
# -----------------------------------------------------------------------------
elif page == "Model Benchmark":
    st.title("📊 Fair Classical vs Quantum Benchmark")
    st.markdown("Head-to-head empirical comparison using the exact same stratified training and held-out test splits.")

    c_model, c_train_t = train_classical_svc(X_train, y_train)
    c_preds, _, c_inf_t = predict_classical(c_model, X_test)
    c_eval = evaluate_predictions(y_test, c_preds, c_train_t, c_inf_t)

    q_eval = None
    if QISKIT_AVAILABLE:
        with st.spinner("Training Quantum QSVC on Fidelity Kernel Matrix..."):
            q_model, q_train_t, _ = train_quantum_qsvc(X_train, y_train, num_qubits=X_train.shape[1], reps=2)
            q_preds, q_inf_t = predict_quantum(q_model, X_test)
            q_eval = evaluate_predictions(y_test, q_preds, q_train_t, q_inf_t)

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Classical SVC (RBF)")
        st.write(f"**Accuracy:** `{c_eval['accuracy'] * 100:.1f}%`")
        st.write(f"**F1-Score:** `{c_eval['f1_score']:.3f}`")
        st.write(f"**Precision:** `{c_eval['precision']:.3f}` | **Recall:** `{c_eval['recall']:.3f}`")
        st.write(f"**Training Time:** `{c_eval['train_time_ms']:.1f} ms`")
        st.plotly_chart(plot_confusion_matrix(c_eval["confusion_matrix"], "Classical Confusion Matrix"), use_container_width=True)

    with col2:
        st.subheader("Quantum QSVC (ZZFeatureMap)")
        if q_eval:
            st.write(f"**Accuracy:** `{q_eval['accuracy'] * 100:.1f}%`")
            st.write(f"**F1-Score:** `{q_eval['f1_score']:.3f}`")
            st.write(f"**Precision:** `{q_eval['precision']:.3f}` | **Recall:** `{q_eval['recall']:.3f}`")
            st.write(f"**Training Time:** `{q_eval['train_time_ms']:.1f} ms`")
            st.plotly_chart(plot_confusion_matrix(q_eval["confusion_matrix"], "Quantum Confusion Matrix"), use_container_width=True)
        else:
            st.warning("Quantum results unavailable.")

    st.subheader("Low-Data Efficiency Experiment")
    st.markdown("Comparing F1-score across 25%, 50%, 75%, and 100% training subsets on the fixed test set.")
    low_data_records = run_low_data_benchmark(X_train, y_train, X_test, y_test)
    st.plotly_chart(plot_low_data_comparison(low_data_records), use_container_width=True)


# -----------------------------------------------------------------------------
# PAGE 5: EXPERIMENT REPORT
# -----------------------------------------------------------------------------
elif page == "Experiment Report":
    st.title("📝 Experiment Report & Reproducibility")
    st.markdown("Detailed configuration parameters and exportable reports for hackathon review.")

    report_data = {
        "experiment": "Q-Resilience AI: Microgrid Anomaly Detection",
        "hackathon": "VTU Qiskit Fall Fest 2026",
        "random_seed": int(random_seed),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "feature_columns": FEATURE_COLUMNS,
        "scaler": "MinMaxScaler(0, 2*pi)",
        "quantum_circuit": {
            "feature_map": "ZZFeatureMap",
            "num_qubits": 4,
            "reps": 2,
            "entanglement": "linear",
        },
    }

    st.json(report_data)

    st.download_button(
        label="📥 Download Experiment Report (JSON)",
        data=json.dumps(report_data, indent=2),
        file_name="q_resilience_experiment_report.json",
        mime="application/json",
    )

    st.download_button(
        label="📥 Download Telemetry Dataset (CSV)",
        data=df.to_csv(index=False),
        file_name="microgrid_telemetry.csv",
        mime="text/csv",
    )
