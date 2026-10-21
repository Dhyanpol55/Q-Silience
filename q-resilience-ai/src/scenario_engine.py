"""
Scenario Engine & Physical Engineering Rules
Provides preset microgrid conditions and physics-based threshold analysis.
"""

from typing import Dict, Any, List


PRESETS = {
    "normal": {
        "name": "Normal Operating Conditions",
        "description": "Stable PV generation meeting load; battery in float stage.",
        "demand_kw": 52.0,
        "solar_kw": 48.0,
        "battery_soc_pct": 72.0,
        "voltage_dev_v": 0.4,
        "frequency_dev_hz": 0.012,
    },
    "demand_spike": {
        "name": "Sudden Industrial Demand Spike",
        "description": "Heavy industrial surge exceeding instantaneous BESS ramping capacity.",
        "demand_kw": 138.0,
        "solar_kw": 36.0,
        "battery_soc_pct": 38.0,
        "voltage_dev_v": -8.8,
        "frequency_dev_hz": -0.34,
    },
    "solar_drop": {
        "name": "Solar PV Inverter Trip",
        "description": "Sudden loss of 85% solar PV during midday peak.",
        "demand_kw": 72.0,
        "solar_kw": 5.5,
        "battery_soc_pct": 46.0,
        "voltage_dev_v": -6.2,
        "frequency_dev_hz": -0.24,
    },
    "voltage_sag": {
        "name": "Distribution Voltage Sag",
        "description": "Capacitor bank switching fault creating severe voltage sag (> ±6V).",
        "demand_kw": 56.0,
        "solar_kw": 42.0,
        "battery_soc_pct": 64.0,
        "voltage_dev_v": -11.6,
        "frequency_dev_hz": -0.05,
    },
    "cascading_failure": {
        "name": "Combined Cascading Emergency",
        "description": "Solar PV trip + depleted battery reserve + industrial evening peak.",
        "demand_kw": 145.0,
        "solar_kw": 3.0,
        "battery_soc_pct": 14.0,
        "voltage_dev_v": -13.8,
        "frequency_dev_hz": -0.58,
    },
}


def diagnose_telemetry(values: Dict[str, float]) -> Dict[str, Any]:
    """
    Evaluates microgrid physical telemetry against IEEE 1547 / EN 50160 grid standards.
    """
    v_dev = values.get("voltage_dev_v", 0.0)
    f_dev = values.get("frequency_dev_hz", 0.0)
    demand = values.get("demand_kw", 0.0)
    solar = values.get("solar_kw", 0.0)
    soc = values.get("battery_soc_pct", 50.0)

    warnings: List[str] = []
    
    # Voltage check
    if abs(v_dev) > 6.0:
        warnings.append(f"Voltage deviation ({v_dev:.1f}V) violates IEEE 1547 limit (±6V).")
    elif abs(v_dev) > 3.0:
        warnings.append(f"Voltage deviation ({v_dev:.1f}V) outside nominal band (±3V).")

    # Frequency check
    if abs(f_dev) > 0.20:
        warnings.append(f"Frequency deviation ({f_dev:.3f}Hz) breaches stability ceiling (±0.20Hz).")
    elif abs(f_dev) > 0.05:
        warnings.append(f"Frequency deviation ({f_dev:.3f}Hz) outside nominal band (±0.05Hz).")

    # Power balance
    bess_avail = max(0.0, (soc - 20.0) * 1.5) if soc > 20.0 else 0.0
    net_deficit = demand - (solar + bess_avail)
    if net_deficit > 30.0:
        warnings.append(f"Generation deficit of {net_deficit:.1f} kW exceeds reserve headroom.")

    is_rule_abnormal = len(warnings) > 0 and (abs(v_dev) > 6.0 or abs(f_dev) > 0.20 or net_deficit > 40.0)

    return {
        "is_abnormal_heuristic": is_rule_abnormal,
        "warnings": warnings,
        "net_deficit_kw": round(net_deficit, 1),
    }
