"""
Main Entry Point Module
vtu-hc-ctrl-ai / src / main.py

CLI executable and entry point for Q-Resilience AI microgrid anomaly detection.
Usage:
    python -m src.main
    python -m src.main --data data/microgrid_telemetry.csv --samples 60
    python -m src.main --optimize
    python -m src.main --serve --port 8000
"""

import sys
import os
import argparse
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

from .circuit import build_circuit, get_circuit_metadata, calculate_quantum_kernel
from .optimizer import train_classical_svc, train_quantum_qsvc, benchmark_models, QuantumOptimizer


def generate_synthetic_microgrid_data(n_samples: int = 100, seed: int = 42) -> pd.DataFrame:
    """
    Generates reproducible, physics-grounded microgrid sensor observations.
    """
    np.random.seed(seed)
    records = []

    for i in range(n_samples):
        hour = (i % 24)
        solar_base = max(0.0, np.sin((hour - 6) / 12 * np.pi) * 65.0) if 6 <= hour <= 18 else 0.0

        # Scenario distribution
        fault_type = "normal"
        if i % 9 == 0:
            fault_type = "demand_spike"
        elif i % 14 == 0:
            fault_type = "solar_drop"
        elif i % 21 == 0:
            fault_type = "voltage_sag"
        elif i % 35 == 0:
            fault_type = "frequency_instability"

        if fault_type == "normal":
            demand = float(np.clip(45.0 + np.sin(i / 5.0) * 18.0 + np.random.normal(0, 4.0), 10.0, 95.0))
            solar = float(np.clip(solar_base + np.random.normal(0, 3.0), 0.0, 75.0))
            soc = float(np.clip(65.0 + (solar - demand) * 0.15 + np.random.normal(0, 2.0), 20.0, 95.0))
            v_dev = float(np.random.normal(0.0, 1.8))
            f_dev = float(np.random.normal(0.0, 0.03))
            is_abnormal = 0
            scenario = "Nominal Equilibrium"
        elif fault_type == "demand_spike":
            demand = float(np.random.uniform(115.0, 145.0))
            solar = float(solar_base * 0.9)
            soc = float(np.clip(50.0 - demand * 0.1, 15.0, 60.0))
            v_dev = float(np.random.uniform(-9.5, -6.5))
            f_dev = float(np.random.uniform(-0.35, -0.15))
            is_abnormal = 1
            scenario = "Sudden Industrial Demand Spike"
        elif fault_type == "solar_drop":
            demand = float(np.random.uniform(50.0, 75.0))
            solar = float(np.random.uniform(0.5, 4.0))
            soc = float(np.clip(45.0 - (demand - solar) * 0.2, 12.0, 40.0))
            v_dev = float(np.random.uniform(-7.5, -4.5))
            f_dev = float(np.random.uniform(-0.25, -0.10))
            is_abnormal = 1
            scenario = "Rapid Solar PV Inverter Trip"
        elif fault_type == "voltage_sag":
            demand = float(np.random.uniform(60.0, 85.0))
            solar = float(solar_base)
            soc = 55.0
            v_dev = float(np.random.uniform(-14.0, -8.5))
            f_dev = float(np.random.normal(0.0, 0.05))
            is_abnormal = 1
            scenario = "Feeder Impedance Voltage Sag"
        else:
            demand = float(np.random.uniform(70.0, 100.0))
            solar = float(solar_base * 0.5)
            soc = 35.0
            v_dev = float(np.random.uniform(-6.0, 4.0))
            f_dev = float(np.random.uniform(-0.55, -0.28))
            is_abnormal = 1
            scenario = "Loss of Grid Synchronism"

        records.append({
            "timestamp": f"2026-10-21T{hour:02d}:{(i*15)%60:02d}:00Z",
            "demand_kw": round(demand, 2),
            "solar_kw": round(solar, 2),
            "battery_soc_pct": round(soc, 1),
            "voltage_dev_v": round(v_dev, 2),
            "frequency_dev_hz": round(f_dev, 3),
            "is_abnormal": is_abnormal,
            "scenario": scenario,
        })

    return pd.DataFrame(records)


def main():
    parser = argparse.ArgumentParser(
        description="VTU-QFF Ctrl_AI — Q-Resilience AI Quantum-Enhanced Microgrid Anomaly Detection"
    )
    parser.add_argument("--data", type=str, default="data/microgrid_telemetry.csv", help="Path to telemetry CSV")
    parser.add_argument("--samples", type=int, default=60, help="Number of samples to evaluate for quantum kernel")
    parser.add_argument("--qubits", type=int, default=4, help="Number of qubits in quantum feature map")
    parser.add_argument("--reps", type=int, default=2, help="Number of entangling repetitions (d)")
    parser.add_argument("--c-param", type=float, default=1.0, help="SVM regularization parameter C")
    parser.add_argument("--optimize", action="store_true", help="Run hyperparameter optimization loop")
    parser.add_argument("--serve", action="store_true", help="Launch FastAPI web service")
    parser.add_argument("--port", type=int, default=8000, help="Server port when running --serve")

    args = parser.parse_args()

    # If --serve requested, delegate to FastAPI backend
    if args.serve:
        try:
            import uvicorn
            from backend.main import app
            print(f"[*] Starting Q-Resilience AI FastAPI service on port {args.port}...")
            uvicorn.run(app, host="0.0.0.0", port=args.port)
            return
        except Exception as e:
            print(f"[!] Error launching FastAPI server: {e}")
            sys.exit(1)

    print("=" * 78)
    print("  ⚛️  Q-RESILIENCE AI — QUANTUM MICROGRID ANOMALY DETECTION PIPELINE")
    print("  Team: Ctrl_AI (VTU-QFF-HC-0025) · VTU-Qiskit Fall Fest 2026")
    print("=" * 78)

    # 1. Load or generate dataset
    if os.path.exists(args.data):
        print(f"[+] Loading dataset from: {args.data}")
        df = pd.read_csv(args.data)
    else:
        print(f"[!] Dataset not found at {args.data}. Synthesizing microgrid telemetry...")
        df = generate_synthetic_microgrid_data(n_samples=args.samples)
        os.makedirs(os.path.dirname(args.data) or ".", exist_ok=True)
        df.to_csv(args.data, index=False)
        print(f"[+] Saved synthetic telemetry to {args.data}")

    # Limit to specified samples for efficient quantum simulator execution
    if len(df) > args.samples:
        df_sub = df.sample(n=args.samples, random_state=42).reset_index(drop=True)
    else:
        df_sub = df

    feature_cols = ["demand_kw", "solar_kw", "voltage_dev_v", "frequency_dev_hz"]
    X_raw = df_sub[feature_cols].values
    y = df_sub["is_abnormal"].values

    anomaly_count = int(np.sum(y))
    print(f"[+] Dataset: {len(X_raw)} total samples | Normal: {len(X_raw) - anomaly_count} | Abnormal: {anomaly_count}")

    # 2. Angle Preprocessing (Scale features to [0, 2*pi])
    scaler = MinMaxScaler(feature_range=(0.0, 2.0 * np.pi))
    X_scaled = scaler.fit_transform(X_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.30, random_state=42, stratify=y
    )
    print(f"[+] Split: {len(X_train)} Train samples, {len(X_test)} Test samples")

    # 3. Build Quantum Circuit
    print("\n" + "-" * 78)
    print(f"  QUANTUM CIRCUIT CONSTRUCTION (Qubits: {args.qubits}, Repetitions: {args.reps})")
    print("-" * 78)
    circuit = build_circuit(num_qubits=args.qubits, reps=args.reps, entanglement="linear")
    meta = get_circuit_metadata(circuit)
    print(f"  • Circuit Depth:       {meta['depth']}")
    print(f"  • Total Quantum Gates: {meta['total_gates']}")
    print(f"  • Gate Decomposition:  {meta['gate_counts']}")
    print(f"  • Hilbert Dimension:   2^{args.qubits} = {2 ** args.qubits}")

    # Optional optimization loop
    if args.optimize:
        print("\n" + "-" * 78)
        print("  EXECUTING QUANTUM OPTIMIZATION LOOP")
        print("-" * 78)
        optimizer = QuantumOptimizer(num_qubits=args.qubits, reps=args.reps)
        best = optimizer.optimize_hyperparameters(X_train, y_train)
        print(f"  [✓] Optimization Complete. Best Parameters: {best}")
        args.c_param = best["C"]
        args.reps = best["reps"]

    # 4. Fair Benchmark Execution
    print("\n" + "-" * 78)
    print(f"  EXECUTING FAIR BENCHMARK: CLASSICAL SVC vs QUANTUM QSVC")
    print("-" * 78)
    results = benchmark_models(
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        num_qubits=args.qubits,
        reps=args.reps,
        C=args.c_param,
    )

    c = results["classical"]
    q = results["quantum"]

    # Format Results Table
    print(f"\n{'Metric':<22} | {'Classical SVC (RBF)':<20} | {'Quantum QSVC (ZZ)':<20}")
    print("-" * 70)
    print(f"{'Accuracy':<22} | {c['accuracy']:<20.1%} | {q['accuracy']:<20.1%}")
    print(f"{'Precision':<22} | {c['precision']:<20.1%} | {q['precision']:<20.1%}")
    print(f"{'Recall':<22} | {c['recall']:<20.1%} | {q['recall']:<20.1%}")
    print(f"{'F1 Score':<22} | {c['f1']:<20.1%} | {q['f1']:<20.1%}")
    print(f"{'Train Time':<22} | {f'{c[\"train_time_ms\"]} ms':<20} | {f'{q[\"train_time_ms\"]} ms':<20}")
    print(f"{'Inference Time':<22} | {f'{c[\"pred_time_ms\"]} ms':<20} | {f'{q[\"pred_time_ms\"]} ms':<20}")
    print("-" * 70)
    print(f"\n[Verdict]: {results['verdict']}")
    print(f"[Winner]:  {results['winner']}")
    print("\n" + "=" * 78 + "\n")


if __name__ == "__main__":
    main()
