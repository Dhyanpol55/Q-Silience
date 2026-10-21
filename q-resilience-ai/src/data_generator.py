"""
Microgrid Synthetic Data Generator
Generates reproducible multi-modal telemetry with transparent, configurable anomaly rules.
"""

from typing import Dict, List, Tuple
import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "demand_kw",
    "solar_kw",
    "battery_soc_pct",
    "voltage_dev_v",
    "frequency_dev_hz",
]


def generate_microgrid_dataset(
    n_samples: int = 120,
    seed: int = 42,
    abnormal_ratio: float = 0.35,
) -> pd.DataFrame:
    """
    Generates a reproducible microgrid sensor dataset.
    
    Parameters:
        n_samples: Total number of observations.
        seed: Random seed for exact reproducibility.
        abnormal_ratio: Target fraction of abnormal operating conditions.
        
    Returns:
        DataFrame containing 5 telemetry features, binary label, and scenario metadata.
    """
    rng = np.random.default_rng(seed)
    records = []

    for i in range(n_samples):
        is_abnormal = 1 if rng.uniform() < abnormal_ratio else 0
        hour = i % 24
        timestamp = f"2026-10-21T{hour:02d}:00:00Z"

        # Baseline solar curve peaking at midday
        solar_base = max(0.0, np.sin((hour - 6) / 12 * np.pi) * 65.0) if 6 <= hour <= 18 else 0.0

        if is_abnormal == 0:
            # Normal operating conditions within IEEE 1547 / EN 50160 boundaries
            demand_kw = float(np.clip(rng.normal(55.0, 12.0), 15.0, 95.0))
            solar_kw = float(np.clip(rng.normal(solar_base, 3.5), 0.0, 80.0))
            battery_soc_pct = float(np.clip(rng.normal(65.0, 12.0), 25.0, 95.0))
            voltage_dev_v = float(rng.normal(0.2, 1.2))  # within ±3V nominal
            frequency_dev_hz = float(rng.normal(0.01, 0.025))  # within ±0.06 Hz nominal
            scenario_type = "normal"
            reason = "Supply-demand equilibrium within nominal compliance bounds."
        else:
            # Configurable deterministic anomaly scenarios
            scenario_roll = rng.uniform()
            if scenario_roll < 0.25:
                # Sudden Demand Spike
                scenario_type = "demand_spike"
                demand_kw = float(np.clip(rng.normal(132.0, 14.0), 105.0, 160.0))
                solar_kw = float(np.clip(rng.normal(solar_base * 0.9, 4.0), 0.0, 75.0))
                battery_soc_pct = float(np.clip(rng.normal(40.0, 10.0), 20.0, 60.0))
                voltage_dev_v = float(rng.normal(-7.8, 1.8))
                frequency_dev_hz = float(rng.normal(-0.32, 0.08))
                reason = "Heavy load surge exceeding instantaneous BESS inverter ramping rate."
            elif scenario_roll < 0.50:
                # Solar Generation Drop (PV Trip)
                scenario_type = "solar_drop"
                demand_kw = float(np.clip(rng.normal(70.0, 10.0), 45.0, 90.0))
                solar_kw = float(np.clip(rng.normal(solar_base * 0.15, 2.0), 0.0, 12.0))
                battery_soc_pct = float(np.clip(rng.normal(48.0, 10.0), 25.0, 70.0))
                voltage_dev_v = float(rng.normal(-5.5, 1.6))
                frequency_dev_hz = float(rng.normal(-0.22, 0.05))
                reason = "Solar PV inverter trip without primary spinning reserve."
            elif scenario_roll < 0.75:
                # Feeder Voltage Sag / Swell
                scenario_type = "voltage_sag"
                demand_kw = float(np.clip(rng.normal(60.0, 12.0), 30.0, 85.0))
                solar_kw = float(np.clip(rng.normal(solar_base, 4.0), 0.0, 75.0))
                battery_soc_pct = float(np.clip(rng.normal(60.0, 10.0), 30.0, 85.0))
                voltage_dev_v = float(rng.normal(-10.5, 2.2) if rng.uniform() > 0.5 else rng.normal(9.5, 2.2))
                frequency_dev_hz = float(rng.normal(0.02, 0.08))
                reason = "Feeder impedance step fault causing voltage regulation breach (> ±6V)."
            else:
                # Cascading Overload Emergency
                scenario_type = "cascading_failure"
                demand_kw = float(np.clip(rng.normal(140.0, 12.0), 115.0, 165.0))
                solar_kw = float(np.clip(rng.normal(solar_base * 0.2, 2.5), 0.0, 15.0))
                battery_soc_pct = float(np.clip(rng.normal(16.0, 3.5), 8.0, 24.0))
                voltage_dev_v = float(rng.normal(-12.8, 2.0))
                frequency_dev_hz = float(rng.normal(-0.55, 0.10))
                reason = "Cascading event: PV trip coupled with depleted BESS and peak load."

        records.append({
            "sample_id": f"SMP-{i+1:04d}",
            "timestamp": timestamp,
            "demand_kw": round(demand_kw, 2),
            "solar_kw": round(solar_kw, 2),
            "battery_soc_pct": round(battery_soc_pct, 1),
            "voltage_dev_v": round(voltage_dev_v, 2),
            "frequency_dev_hz": round(frequency_dev_hz, 3),
            "is_abnormal": int(is_abnormal),
            "scenario_type": scenario_type,
            "scenario_reason": reason,
        })

    return pd.DataFrame(records)


def validate_microgrid_dataframe(df: pd.DataFrame) -> Tuple[bool, str]:
    """
    Validates microgrid dataframe schema and contents.
    """
    required = FEATURE_COLUMNS + ["is_abnormal"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        return False, f"Missing required columns: {', '.join(missing)}"

    if len(df) < 10:
        return False, "Dataset must have at least 10 rows."

    labels = set(df["is_abnormal"].unique())
    if not labels.issubset({0, 1}) or len(labels) < 2:
        return False, "is_abnormal column must contain both 0 and 1 classes."

    # Check for NaN values
    if df[required].isna().any().any():
        return False, "Dataset contains null or NaN values in feature columns."

    return True, "Dataset schema is valid."
