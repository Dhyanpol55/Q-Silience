"""
Interactive Visualizations with Plotly
Generates telemetry scatter plots, confusion matrices, and model comparison charts.
"""

from typing import Dict, Any, List
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go


def plot_telemetry_distribution(df: pd.DataFrame) -> go.Figure:
    """
    Renders 2D scatter of Voltage Deviation vs Frequency Deviation colored by Operating Condition.
    """
    fig = px.scatter(
        df,
        x="frequency_dev_hz",
        y="voltage_dev_v",
        color=df["is_abnormal"].map({0: "Normal", 1: "Abnormal"}),
        color_discrete_map={"Normal": "#10b981", "Abnormal": "#ef4444"},
        hover_data=["demand_kw", "solar_kw", "battery_soc_pct", "scenario_type"],
        title="Microgrid Telemetry: Voltage vs Frequency Deviation Space",
        labels={"frequency_dev_hz": "Frequency Deviation (Hz)", "voltage_dev_v": "Voltage Deviation (V)"},
        template="plotly_dark",
    )
    fig.update_layout(
        paper_bgcolor="#0b1120",
        plot_bgcolor="#0f172a",
        font=dict(color="#cbd5e1"),
    )
    return fig


def plot_confusion_matrix(cm: List[List[int]], title: str) -> go.Figure:
    """
    Renders confusion matrix heatmap.
    """
    z = cm
    x = ["Pred: Normal", "Pred: Abnormal"]
    y = ["Actual: Normal", "Actual: Abnormal"]

    fig = go.Figure(data=go.Heatmap(
        z=z,
        x=x,
        y=y,
        colorscale="Blues",
        text=z,
        texttemplate="%{text}",
        textfont={"size": 18},
    ))
    fig.update_layout(
        title=title,
        paper_bgcolor="#0b1120",
        plot_bgcolor="#0f172a",
        font=dict(color="#cbd5e1"),
    )
    return fig


def plot_low_data_comparison(benchmark_records: List[Dict[str, Any]]) -> go.Figure:
    """
    Plots F1-Score scaling curve for Classical SVC vs Quantum QSVC across training sample fractions.
    """
    fractions = [r["fraction"] * 100 for r in benchmark_records]
    c_f1 = [r["classical"]["f1_score"] if "f1_score" in r["classical"] else 0.0 for r in benchmark_records]
    q_f1 = [r["quantum"]["f1_score"] if r["quantum"] and "f1_score" in r["quantum"] else 0.0 for r in benchmark_records]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=fractions,
        y=c_f1,
        mode="lines+markers",
        name="Classical SVC (RBF)",
        line=dict(color="#38bdf8", width=3),
    ))
    fig.add_trace(go.Scatter(
        x=fractions,
        y=q_f1,
        mode="lines+markers",
        name="Quantum QSVC (ZZFeatureMap)",
        line=dict(color="#a855f7", width=3, dash="dot"),
    ))

    fig.update_layout(
        title="Sample Efficiency: Classical SVC vs Quantum QSVC across Training Fractions",
        xaxis_title="Training Set Fraction (%)",
        yaxis_title="F1-Score (Abnormal Class)",
        paper_bgcolor="#0b1120",
        plot_bgcolor="#0f172a",
        font=dict(color="#cbd5e1"),
        yaxis=dict(range=[0, 1.05]),
    )
    return fig
